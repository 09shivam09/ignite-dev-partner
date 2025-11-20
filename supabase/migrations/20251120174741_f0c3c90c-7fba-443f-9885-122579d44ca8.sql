-- Create follows table for user relationships
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create bookmarks table for saved posts
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create reports table for content moderation
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(user_id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create media renditions table for adaptive bitrate
CREATE TABLE media_renditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  quality TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  width INT,
  height INT,
  bitrate_kbps INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create post engagement table for ranking
CREATE TABLE post_engagement (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  engagement_score DECIMAL DEFAULT 0,
  likes_weight DECIMAL DEFAULT 0,
  comments_weight DECIMAL DEFAULT 0,
  views_weight DECIMAL DEFAULT 0,
  shares_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for fast queries
CREATE INDEX idx_follows_follower ON follows(follower_id, created_at DESC);
CREATE INDEX idx_follows_following ON follows(following_id, created_at DESC);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_post ON bookmarks(post_id);
CREATE INDEX idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX idx_reports_post ON reports(post_id);
CREATE INDEX idx_renditions_post ON media_renditions(post_id, quality);
CREATE INDEX idx_engagement_score ON post_engagement(engagement_score DESC);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_renditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_engagement ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows
CREATE POLICY "Users can manage their own follows"
  ON follows FOR ALL
  USING (follower_id = auth.uid());

CREATE POLICY "Users can view all follows"
  ON follows FOR SELECT
  USING (true);

-- RLS Policies for bookmarks
CREATE POLICY "Users can manage their own bookmarks"
  ON bookmarks FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can manage reports"
  ON reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for media renditions
CREATE POLICY "Media renditions are publicly readable"
  ON media_renditions FOR SELECT
  USING (true);

CREATE POLICY "Only post owners can manage renditions"
  ON media_renditions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = media_renditions.post_id 
      AND posts.user_id = auth.uid()
    )
  );

-- RLS Policies for post engagement
CREATE POLICY "Post engagement is publicly readable"
  ON post_engagement FOR SELECT
  USING (true);

-- Add follower/following counts to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles SET following_count = following_count + 1
    WHERE user_id = NEW.follower_id;
    
    -- Increment follower count for following
    UPDATE profiles SET follower_count = follower_count + 1
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0)
    WHERE user_id = OLD.follower_id;
    
    -- Decrement follower count for following
    UPDATE profiles SET follower_count = GREATEST(follower_count - 1, 0)
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follow counts
CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- Function to update engagement scores (called by background job)
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_post_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_likes INT;
  v_comments INT;
  v_views INT;
  v_shares INT;
  v_age_hours DECIMAL;
  v_recency_factor DECIMAL;
  v_score DECIMAL;
BEGIN
  -- Get post metrics
  SELECT 
    COALESCE(like_count, 0),
    COALESCE(comment_count, 0),
    COALESCE(view_count, 0),
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
  INTO v_likes, v_comments, v_views, v_age_hours
  FROM posts
  WHERE id = p_post_id;
  
  -- Get shares count
  SELECT COALESCE(shares_count, 0)
  INTO v_shares
  FROM post_engagement
  WHERE post_id = p_post_id;
  
  -- Calculate recency decay (exponential decay, half-life 48hrs)
  v_recency_factor := EXP(-v_age_hours / 48.0);
  
  -- Calculate weighted engagement score
  v_score := (
    (v_likes * 2) +
    (v_comments * 5) +
    (v_shares * 10) +
    (v_views * 0.01)
  ) * v_recency_factor;
  
  -- Update or insert engagement record
  INSERT INTO post_engagement (
    post_id, 
    engagement_score,
    likes_weight,
    comments_weight,
    views_weight,
    shares_count,
    updated_at
  )
  VALUES (
    p_post_id,
    v_score,
    v_likes * 2,
    v_comments * 5,
    v_views * 0.01,
    v_shares,
    NOW()
  )
  ON CONFLICT (post_id) 
  DO UPDATE SET
    engagement_score = v_score,
    likes_weight = v_likes * 2,
    comments_weight = v_comments * 5,
    views_weight = v_views * 0.01,
    updated_at = NOW();
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;
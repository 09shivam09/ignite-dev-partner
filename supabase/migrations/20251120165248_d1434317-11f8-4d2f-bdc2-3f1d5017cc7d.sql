-- Create events table first for event-specific feeds
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(user_id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT, -- 'wedding', 'corporate', 'birthday', etc.
  event_date DATE,
  location TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_creator ON events(creator_id, created_at DESC);
CREATE INDEX idx_events_date ON events(event_date DESC) WHERE event_date IS NOT NULL;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their events"
  ON events FOR UPDATE
  USING (auth.uid() = creator_id);

-- Extend posts table for media support (videos/photos)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('text', 'photo', 'reel', 'video')) DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id),
  ADD COLUMN IF NOT EXISTS title TEXT,
  
  -- Video processing metadata
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready' 
    CHECK (processing_status IN ('uploading', 'processing', 'ready', 'failed')),
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  
  -- Video-specific fields (Mux integration)
  ADD COLUMN IF NOT EXISTS mux_asset_id TEXT,
  ADD COLUMN IF NOT EXISTS mux_playback_id TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  
  -- File metadata
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  
  -- Engagement metrics
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_media_type ON posts(media_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_event ON posts(event_id, created_at DESC) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_user_media ON posts(user_id, media_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_moderation ON posts(moderation_status, processing_status);
CREATE INDEX IF NOT EXISTS idx_posts_trending ON posts(view_count DESC, created_at DESC);

-- Create moderation queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  flagged_reason TEXT, -- 'explicit_content', 'violence', 'spam', 'copyright'
  confidence_score DECIMAL(3,2), -- 0.00-1.00 from AI moderation
  reviewed_by UUID REFERENCES profiles(user_id),
  reviewed_at TIMESTAMPTZ,
  action TEXT DEFAULT 'pending' CHECK (action IN ('approve', 'reject', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_pending ON moderation_queue(action, created_at) 
  WHERE action = 'pending';
CREATE INDEX IF NOT EXISTS idx_moderation_post ON moderation_queue(post_id);

-- Enable RLS on moderation_queue
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all moderation items
CREATE POLICY "Admins can manage moderation queue"
  ON moderation_queue FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view moderation status of their own posts
CREATE POLICY "Users can view their post moderation status"
  ON moderation_queue FOR SELECT
  USING (post_id IN (SELECT id FROM posts WHERE user_id = auth.uid()));

-- Create media analytics table (view tracking)
CREATE TABLE IF NOT EXISTS media_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(user_id),
  session_id TEXT, -- For anonymous tracking
  watch_duration_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_views_post ON media_views(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_views_user ON media_views(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Enable RLS on media_views
ALTER TABLE media_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert view events
CREATE POLICY "Anyone can track views"
  ON media_views FOR INSERT
  WITH CHECK (true);

-- Users can view their own analytics
CREATE POLICY "Users can view their analytics"
  ON media_views FOR SELECT
  USING (user_id = auth.uid() OR post_id IN (SELECT id FROM posts WHERE user_id = auth.uid()));

-- Update existing posts RLS to respect moderation status
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  USING (
    moderation_status = 'approved' 
    OR user_id = auth.uid()
  );

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts 
  SET view_count = view_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment view count
DROP TRIGGER IF EXISTS trigger_increment_view_count ON media_views;
CREATE TRIGGER trigger_increment_view_count
  AFTER INSERT ON media_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_post_view_count();

-- Function to update like/comment counts on posts
CREATE OR REPLACE FUNCTION update_post_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for auto-updating engagement counts
DROP TRIGGER IF EXISTS trigger_update_like_count ON likes;
CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_counts();

DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_counts();
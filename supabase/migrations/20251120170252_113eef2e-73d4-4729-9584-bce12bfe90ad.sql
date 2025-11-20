-- Performance indexes for common feed queries

-- Index for fetching approved posts ordered by created_at (main feed query)
CREATE INDEX IF NOT EXISTS idx_posts_feed_query 
ON posts(moderation_status, created_at DESC) 
WHERE moderation_status = 'approved';

-- Index for user's own posts
CREATE INDEX IF NOT EXISTS idx_posts_user_posts 
ON posts(user_id, created_at DESC);

-- Index for event-specific posts
CREATE INDEX IF NOT EXISTS idx_posts_event 
ON posts(event_id, created_at DESC) 
WHERE event_id IS NOT NULL;

-- Index for media type filtering
CREATE INDEX IF NOT EXISTS idx_posts_media_type 
ON posts(media_type, created_at DESC) 
WHERE media_type IS NOT NULL;

-- Index for post engagement queries (likes)
CREATE INDEX IF NOT EXISTS idx_likes_post_user 
ON likes(post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_likes_user 
ON likes(user_id, created_at DESC);

-- Index for comments queries
CREATE INDEX IF NOT EXISTS idx_comments_post 
ON comments(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_user 
ON comments(user_id, created_at DESC);

-- Index for moderation queue queries
CREATE INDEX IF NOT EXISTS idx_moderation_queue_pending 
ON moderation_queue(action, created_at DESC) 
WHERE action = 'pending';

-- Index for media views analytics
CREATE INDEX IF NOT EXISTS idx_media_views_post 
ON media_views(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_views_user 
ON media_views(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- Composite index for feed with engagement counts
CREATE INDEX IF NOT EXISTS idx_posts_engagement 
ON posts(like_count DESC, view_count DESC, created_at DESC) 
WHERE moderation_status = 'approved';
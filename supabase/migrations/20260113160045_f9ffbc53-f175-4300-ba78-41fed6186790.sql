-- Fix the public_profiles view to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures the view respects the querying user's permissions

-- Drop and recreate the view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles 
WITH (security_invoker = true)
AS 
SELECT 
  id, user_id, full_name, username, avatar_url, 
  bio, city, is_verified, profile_views,
  follower_count, following_count, cover_image_url,
  bio_tags, website_url, social_links,
  user_type, profile_completion_score, last_active_at, created_at, updated_at
FROM profiles;

-- Grant SELECT on view to authenticated and anonymous users for social features
GRANT SELECT ON public_profiles TO authenticated, anon;
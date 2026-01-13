-- Fix #1: Protect user contact information (email, phone) from public exposure
-- Drop overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Users can view their own full profile (includes sensitive data)
CREATE POLICY "Users can view their own full profile"
ON profiles FOR SELECT
USING (user_id = auth.uid());

-- Create a secure view for public profile data (excludes email, phone)
CREATE OR REPLACE VIEW public_profiles AS 
SELECT 
  id, user_id, full_name, username, avatar_url, 
  bio, city, is_verified, profile_views,
  follower_count, following_count, cover_image_url,
  bio_tags, website_url, social_links,
  user_type, profile_completion_score, last_active_at, created_at, updated_at
FROM profiles;

-- Grant SELECT on view to authenticated and anonymous users for social features
GRANT SELECT ON public_profiles TO authenticated, anon;

-- Fix #2: Add RLS policies to booking_requests table
-- Consumers can view their own booking requests
CREATE POLICY "Consumers can view their booking requests"
ON booking_requests FOR SELECT
USING (consumer_id = auth.uid());

-- Consumers can create booking requests
CREATE POLICY "Consumers can create booking requests"
ON booking_requests FOR INSERT
WITH CHECK (consumer_id = auth.uid());

-- Consumers can update their booking requests
CREATE POLICY "Consumers can update their booking requests"
ON booking_requests FOR UPDATE
USING (consumer_id = auth.uid());

-- Vendors can view booking requests for their vendor profiles
CREATE POLICY "Vendors can view their booking requests"
ON booking_requests FOR SELECT
USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendors can respond to/update booking requests
CREATE POLICY "Vendors can respond to booking requests"
ON booking_requests FOR UPDATE
USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));
-- Fix function search paths for security
ALTER FUNCTION update_follow_counts() SET search_path = public;
ALTER FUNCTION calculate_engagement_score(UUID) SET search_path = public;
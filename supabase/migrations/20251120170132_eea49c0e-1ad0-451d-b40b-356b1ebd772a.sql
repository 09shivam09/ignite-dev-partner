-- Enable http extension for making requests to edge functions
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Function to trigger auto-moderation on new posts
CREATE OR REPLACE FUNCTION trigger_auto_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url text := current_setting('app.settings.supabase_url', true);
  anon_key text := current_setting('app.settings.supabase_anon_key', true);
BEGIN
  -- Only trigger moderation for media posts (not text-only posts)
  IF NEW.media_type IS NOT NULL THEN
    -- Make async HTTP request to media-moderate function
    PERFORM extensions.http_post(
      url := project_url || '/functions/v1/media-moderate',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || anon_key
      ),
      body := jsonb_build_object(
        'postId', NEW.id,
        'text', NEW.content,
        'imageUrl', CASE WHEN NEW.media_urls IS NOT NULL THEN NEW.media_urls[1] ELSE NULL END
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on posts table
DROP TRIGGER IF EXISTS auto_moderate_new_posts ON posts;
CREATE TRIGGER auto_moderate_new_posts
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_moderation();
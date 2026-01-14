-- Drop the trigger first
DROP TRIGGER IF EXISTS auto_moderate_new_posts ON public.posts;

-- Then drop the function
DROP FUNCTION IF EXISTS public.trigger_auto_moderation();
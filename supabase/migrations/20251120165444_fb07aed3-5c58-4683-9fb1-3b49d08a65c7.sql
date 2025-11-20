-- Create storage buckets for media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('media-videos', 'media-videos', false, 104857600, ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']),
  ('media-photos', 'media-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('media-thumbnails', 'media-thumbnails', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for media-videos bucket
CREATE POLICY "Users can upload their own videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media-videos'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.storage_path = storage.objects.name 
        AND posts.moderation_status = 'approved'
      )
    )
  );

CREATE POLICY "Users can delete their own videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policies for media-photos bucket
CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view approved photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-photos');

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policies for media-thumbnails bucket
CREATE POLICY "System can upload thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media-thumbnails');

CREATE POLICY "Anyone can view thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-thumbnails');

CREATE POLICY "System can delete thumbnails"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media-thumbnails');
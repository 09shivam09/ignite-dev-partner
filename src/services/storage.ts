import { supabase } from '@/integrations/supabase/client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult {
  postId: string;
  storagePath: string;
  publicUrl: string;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export function validateFile(file: File, mediaType: 'photo' | 'video' | 'reel'): string | null {
  const maxSize = mediaType === 'photo' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  const allowedTypes = mediaType === 'photo' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;

  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return `File size exceeds ${maxMB}MB limit`;
  }

  if (!allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed: ${allowedTypes.join(', ')}`;
  }

  return null;
}

export async function uploadMedia(
  file: File,
  mediaType: 'photo' | 'video' | 'reel',
  title?: string,
  eventId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Validate file
  const validationError = validateFile(file, mediaType);
  if (validationError) {
    throw new Error(validationError);
  }

  // Generate unique file path
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const bucket = mediaType === 'photo' ? 'media-photos' : 'media-videos';

  // Create post first
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content: title || file.name,
      title: title || null,
      media_type: mediaType,
      storage_path: fileName,
      mime_type: file.type,
      file_size_bytes: file.size,
      processing_status: mediaType === 'photo' ? 'ready' : 'processing',
      moderation_status: 'approved',
      event_id: eventId || null,
    })
    .select()
    .single();

  if (postError) throw postError;

  // Upload file with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Get public URL
        let publicUrl = '';
        if (bucket === 'media-photos') {
          const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
          publicUrl = data.publicUrl;
        } else {
          const { data } = await supabase.storage
            .from(bucket)
            .createSignedUrl(fileName, 3600);
          publicUrl = data?.signedUrl || '';
        }

        // Update post status
        await supabase
          .from('posts')
          .update({ processing_status: 'ready' })
          .eq('id', post.id);

        resolve({
          postId: post.id,
          storagePath: fileName,
          publicUrl,
        });
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    // Get upload URL and upload
    supabase.storage
      .from(bucket)
      .createSignedUploadUrl(fileName)
      .then(({ data, error }) => {
        if (error) {
          reject(error);
          return;
        }

        xhr.open('PUT', data.signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      })
      .catch(reject);
  });
}

export function getMediaUrl(storagePath: string, mediaType: 'photo' | 'video' | 'reel'): string {
  const bucket = mediaType === 'photo' ? 'media-photos' : 'media-videos';
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

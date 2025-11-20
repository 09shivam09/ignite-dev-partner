import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  fileName: string;
  contentType: string;
  mediaType: 'photo' | 'reel' | 'video';
  eventId?: string;
  title?: string;
  fileSize: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: UploadRequest = await req.json();

    console.log('Upload request:', {
      userId: user.id,
      fileName: body.fileName,
      mediaType: body.mediaType,
      fileSize: body.fileSize,
    });

    // Validate file size limits
    const maxSizes = {
      photo: 10 * 1024 * 1024, // 10MB
      reel: 100 * 1024 * 1024, // 100MB
      video: 100 * 1024 * 1024, // 100MB
    };

    if (body.fileSize > maxSizes[body.mediaType]) {
      throw new Error(`File size exceeds ${maxSizes[body.mediaType] / (1024 * 1024)}MB limit`);
    }

    // Validate content type
    const allowedTypes = {
      photo: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      reel: ['video/mp4', 'video/quicktime', 'video/webm'],
      video: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
    };

    if (!allowedTypes[body.mediaType].includes(body.contentType)) {
      throw new Error('Invalid file type');
    }

    // Generate unique file path
    const fileExt = body.fileName.split('.').pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const bucket = body.mediaType === 'photo' ? 'media-photos' : 'media-videos';
    const storagePath = `${user.id}/${timestamp}-${randomStr}.${fileExt}`;

    // Create signed upload URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (uploadError) {
      console.error('Upload URL error:', uploadError);
      throw uploadError;
    }

    // Create post record in database
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        media_type: body.mediaType,
        title: body.title || null,
        content: body.title || '',
        event_id: body.eventId || null,
        storage_path: storagePath,
        file_size_bytes: body.fileSize,
        mime_type: body.contentType,
        processing_status: body.mediaType === 'photo' ? 'ready' : 'uploading',
        moderation_status: 'pending',
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      throw postError;
    }

    console.log('Upload initialized:', {
      postId: post.id,
      bucket,
      storagePath,
    });

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl: uploadData.signedUrl,
        token: uploadData.token,
        path: uploadData.path,
        postId: post.id,
        bucket,
        storagePath,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in media-upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

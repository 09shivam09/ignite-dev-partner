import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Transcoding Job Handler
 * 
 * This edge function handles video transcoding job submissions.
 * For production, integrate with a transcoding service like:
 * - Mux (https://mux.com) - Recommended for ease of use
 * - Cloudflare Stream (https://cloudflare.com/products/cloudflare-stream/)
 * - AWS MediaConvert
 * 
 * For MVP, we'll create placeholder renditions that point to the original video.
 * Replace this logic with actual transcoding service integration.
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { post_id, storage_path, media_type } = await req.json();

    if (!post_id || !storage_path) {
      return new Response(
        JSON.stringify({ error: 'post_id and storage_path are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting transcoding job for post ${post_id}`);

    // Update post status to processing
    await supabaseClient
      .from('posts')
      .update({ processing_status: 'processing' })
      .eq('id', post_id);

    // TODO: Integrate with actual transcoding service
    // For now, create placeholder renditions
    const renditions = [
      { quality: '1080p', bitrate_kbps: 5000, width: 1920, height: 1080 },
      { quality: '720p', bitrate_kbps: 2500, width: 1280, height: 720 },
      { quality: '480p', bitrate_kbps: 1000, width: 854, height: 480 },
      { quality: '360p', bitrate_kbps: 600, width: 640, height: 360 },
    ];

    // In production, this would:
    // 1. Upload original to transcoding service
    // 2. Service generates multiple quality renditions
    // 3. Webhook callback when transcoding completes
    // 4. Download renditions and upload to Supabase Storage
    // 5. Create media_renditions records

    // For now, create placeholder records pointing to original
    const renditionRecords = renditions.map(r => ({
      post_id,
      quality: r.quality,
      storage_path: storage_path, // Would be different for each quality
      bitrate_kbps: r.bitrate_kbps,
      width: r.width,
      height: r.height,
    }));

    const { error: renditionError } = await supabaseClient
      .from('media_renditions')
      .insert(renditionRecords);

    if (renditionError) {
      console.error('Error creating renditions:', renditionError);
      
      await supabaseClient
        .from('posts')
        .update({ processing_status: 'failed' })
        .eq('id', post_id);

      throw renditionError;
    }

    // Update post status to completed
    await supabaseClient
      .from('posts')
      .update({ processing_status: 'completed' })
      .eq('id', post_id);

    console.log(`Transcoding completed for post ${post_id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Transcoding job completed',
        renditions: renditionRecords.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcoding-job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

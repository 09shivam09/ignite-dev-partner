import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationRequest {
  postId: string;
  imageUrl?: string;
  text?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableAIKey = Deno.env.get('LOVABLE_AI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: ModerationRequest = await req.json();

    console.log('Moderating post:', body.postId);

    // Get post details
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', body.postId)
      .single();

    if (postError) throw postError;

    // Use Lovable AI for content moderation
    const moderationPrompt = `Analyze this content for safety violations. Return a JSON response with:
    - is_safe (boolean)
    - violation_type (string: "explicit_content", "violence", "spam", "hate_speech", or "safe")
    - confidence (number 0-1)
    - reason (string)

    Content to analyze:
    Text: ${post.content || 'No text'}
    Title: ${post.title || 'No title'}
    Media Type: ${post.media_type}`;

    const aiResponse = await fetch('https://api.lovable.app/v1/ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation AI. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: moderationPrompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI moderation failed');
    }

    const aiResult = await aiResponse.json();
    const moderation = JSON.parse(aiResult.choices[0].message.content);

    console.log('Moderation result:', moderation);

    // Update post moderation status
    const newStatus = moderation.is_safe ? 'approved' : 'flagged';
    
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        moderation_status: newStatus,
      })
      .eq('id', body.postId);

    if (updateError) throw updateError;

    // If flagged, add to moderation queue
    if (!moderation.is_safe) {
      await supabase.from('moderation_queue').insert({
        post_id: body.postId,
        flagged_reason: moderation.violation_type,
        confidence_score: moderation.confidence,
        action: 'pending',
        notes: moderation.reason,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        post_id: body.postId,
        moderation_status: newStatus,
        moderation_result: moderation,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in media-moderate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

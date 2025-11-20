import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Engagement Score Calculator
 * 
 * This edge function calculates and updates engagement scores for posts.
 * Can be called:
 * 1. On-demand via HTTP for specific posts
 * 2. Via scheduled cron job for all recent posts
 * 3. After user interactions (likes, comments, shares)
 * 
 * Engagement Score Formula:
 * score = (likes × 2) + (comments × 5) + (shares × 10) + (views × 0.01) + recency_decay
 * 
 * Recency decay uses exponential decay with 48hr half-life
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { post_id, batch_mode = false } = await req.json();

    let postsToProcess: Array<{
      id: string;
      created_at: string;
      like_count: number | null;
      comment_count: number | null;
      view_count: number | null;
    }> = [];

    if (batch_mode) {
      // Process all posts from last 7 days
      const { data: recentPosts, error } = await supabaseClient
        .from('posts')
        .select('id, created_at, like_count, comment_count, view_count')
        .eq('moderation_status', 'approved')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      postsToProcess = recentPosts || [];
    } else if (post_id) {
      // Process single post
      const { data: post, error } = await supabaseClient
        .from('posts')
        .select('id, created_at, like_count, comment_count, view_count')
        .eq('id', post_id)
        .single();

      if (error) throw error;
      if (post) postsToProcess = [post];
    } else {
      return new Response(
        JSON.stringify({ error: 'Either post_id or batch_mode=true required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${postsToProcess.length} posts for engagement scoring`);

    const results = [];

    for (const post of postsToProcess) {
      const score = calculateEngagementScore(post);
      
      // Get shares count from engagement table if exists
      const { data: existingEngagement } = await supabaseClient
        .from('post_engagement')
        .select('shares_count')
        .eq('post_id', post.id)
        .maybeSingle();

      const sharesCount = existingEngagement?.shares_count || 0;

      // Upsert engagement record
      const { error: upsertError } = await supabaseClient
        .from('post_engagement')
        .upsert({
          post_id: post.id,
          engagement_score: score,
          likes_weight: (post.like_count || 0) * 2,
          comments_weight: (post.comment_count || 0) * 5,
          views_weight: (post.view_count || 0) * 0.01,
          shares_count: sharesCount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'post_id',
        });

      if (upsertError) {
        console.error(`Error updating engagement for post ${post.id}:`, upsertError);
      } else {
        results.push({
          post_id: post.id,
          score: Math.round(score * 100) / 100,
        });
      }
    }

    console.log(`Engagement scoring completed for ${results.length} posts`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: batch_mode ? `Processed ${results.length} posts` : results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in engagement-calculator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Calculate engagement score with recency decay
 */
function calculateEngagementScore(post: {
  created_at: string;
  like_count: number | null;
  comment_count: number | null;
  view_count: number | null;
}): number {
  const likes = post.like_count || 0;
  const comments = post.comment_count || 0;
  const views = post.view_count || 0;

  // Calculate age in hours
  const createdAt = new Date(post.created_at).getTime();
  const now = Date.now();
  const ageHours = (now - createdAt) / (1000 * 60 * 60);

  // Recency decay: exponential decay with 48hr half-life
  // After 48 hours, weight is halved; after 96 hours, quartered, etc.
  const recencyFactor = Math.exp(-ageHours / 48.0);

  // Weighted engagement score
  const rawScore = (
    (likes * 2) +
    (comments * 5) +
    (views * 0.01)
  );

  // Apply recency decay
  const finalScore = rawScore * recencyFactor;

  return finalScore;
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Report Post Handler
 * 
 * Handles user reports for inappropriate content with rate limiting
 */

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const MAX_REPORTS_PER_HOUR = 5;

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { post_id, reason, description } = await req.json();

    // Input validation
    if (!post_id || typeof post_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid post_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Valid reason is required (max 100 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validReasons = ['spam', 'harassment', 'inappropriate', 'misinformation', 'violence', 'other'];
    if (!validReasons.includes(reason)) {
      return new Response(
        JSON.stringify({ error: 'Invalid reason. Must be one of: ' + validReasons.join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (description && (typeof description !== 'string' || description.length > 500)) {
      return new Response(
        JSON.stringify({ error: 'Description must be less than 500 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString();
    const { count, error: countError } = await supabaseClient
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_id', user.id)
      .gte('created_at', oneHourAgo);

    if (countError) throw countError;

    if (count && count >= MAX_REPORTS_PER_HOUR) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. You can only submit 5 reports per hour.',
          retry_after: RATE_LIMIT_WINDOW,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseClient
      .from('posts')
      .select('id, user_id')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent reporting own posts
    if (post.user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'You cannot report your own posts' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already reported this post
    const { data: existingReport } = await supabaseClient
      .from('reports')
      .select('id')
      .eq('post_id', post_id)
      .eq('reporter_id', user.id)
      .maybeSingle();

    if (existingReport) {
      return new Response(
        JSON.stringify({ error: 'You have already reported this post' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize description (trim and limit)
    const sanitizedDescription = description 
      ? description.trim().substring(0, 500)
      : null;

    // Create report
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .insert({
        post_id,
        reporter_id: user.id,
        reason: reason.trim(),
        description: sanitizedDescription,
        status: 'pending',
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Check if post has multiple reports (auto-flag threshold)
    const { count: reportCount } = await supabaseClient
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post_id)
      .eq('status', 'pending');

    // If 3+ reports, add to moderation queue
    if (reportCount && reportCount >= 3) {
      await supabaseClient
        .from('moderation_queue')
        .insert({
          post_id,
          flagged_reason: `Multiple reports (${reportCount})`,
          confidence_score: 0.8,
        });

      console.log(`Post ${post_id} auto-flagged due to ${reportCount} reports`);
    }

    console.log(`Report created: ${report.id} for post ${post_id} by user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        report_id: report.id,
        message: 'Thank you for your report. Our team will review it shortly.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in report-post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

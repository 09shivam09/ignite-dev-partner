import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Share Post Handler
 * 
 * Increments the share count for a post and updates engagement score
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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { post_id } = await req.json();

    if (!post_id) {
      return new Response(
        JSON.stringify({ error: 'post_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment share count
    const { data: engagement, error: engagementError } = await supabaseClient
      .from('post_engagement')
      .select('shares_count')
      .eq('post_id', post_id)
      .maybeSingle();

    const currentShares = engagement?.shares_count || 0;

    await supabaseClient
      .from('post_engagement')
      .upsert({
        post_id,
        shares_count: currentShares + 1,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'post_id',
      });

    // Trigger engagement score recalculation
    await supabaseClient.functions.invoke('engagement-calculator', {
      body: { post_id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        shares_count: currentShares + 1,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in share-post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

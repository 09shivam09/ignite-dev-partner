import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { post_id, action } = await req.json();

    if (!post_id) {
      return new Response(
        JSON.stringify({ error: 'post_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'bookmark') {
      // Create bookmark
      const { error: bookmarkError } = await supabaseClient
        .from('bookmarks')
        .insert({
          user_id: user.id,
          post_id: post_id,
        });

      if (bookmarkError) {
        // Check if already bookmarked
        if (bookmarkError.code === '23505') {
          return new Response(
            JSON.stringify({ bookmarked: true, message: 'Already bookmarked' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw bookmarkError;
      }
    } else if (action === 'unbookmark') {
      // Remove bookmark
      const { error: unbookmarkError } = await supabaseClient
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', post_id);

      if (unbookmarkError) throw unbookmarkError;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "bookmark" or "unbookmark"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        bookmarked: action === 'bookmark',
        post_id: post_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in bookmark-post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

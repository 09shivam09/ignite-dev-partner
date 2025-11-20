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

    const { user_id, action } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-follow
    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot follow yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'follow') {
      // Create follow relationship
      const { error: followError } = await supabaseClient
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: user_id,
        });

      if (followError) {
        // Check if already following
        if (followError.code === '23505') {
          return new Response(
            JSON.stringify({ following: true, message: 'Already following this user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw followError;
      }
    } else if (action === 'unfollow') {
      // Remove follow relationship
      const { error: unfollowError } = await supabaseClient
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', user_id);

      if (unfollowError) throw unfollowError;
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "follow" or "unfollow"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get updated follower count
    const { data: targetUser } = await supabaseClient
      .from('profiles')
      .select('follower_count, following_count')
      .eq('user_id', user_id)
      .single();

    return new Response(
      JSON.stringify({
        following: action === 'follow',
        follower_count: targetUser?.follower_count || 0,
        following_count: targetUser?.following_count || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in follow-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

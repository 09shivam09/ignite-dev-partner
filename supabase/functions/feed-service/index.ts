import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedRequest {
  type?: 'following' | 'discover' | 'events';
  cursor?: string;
  limit?: number;
  event_id?: string;
}

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

    const { type = 'following', cursor, limit = 20, event_id }: FeedRequest = await req.json();

    // Decode cursor if provided
    const cursorData = cursor ? JSON.parse(atob(cursor)) : null;

    // Build base query
    let query = supabaseClient
      .from('posts')
      .select(`
        id,
        content,
        title,
        media_type,
        storage_path,
        thumbnail_url,
        like_count,
        comment_count,
        view_count,
        created_at,
        user:profiles!posts_user_id_fkey (
          user_id,
          full_name,
          avatar_url
        )
      `)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to determine has_more

    // Apply feed type filters
    if (type === 'following') {
      // Get user's follows
      const { data: follows } = await supabaseClient
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = (follows || []).map(f => f.following_id);
      
      if (followingIds.length === 0) {
        // User doesn't follow anyone, return empty feed
        return new Response(
          JSON.stringify({ data: [], next_cursor: null, has_more: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      query = query.in('user_id', followingIds);
    } else if (type === 'events' && event_id) {
      query = query.eq('event_id', event_id);
    } else if (type === 'discover') {
      // For discover feed, we'll join with engagement scores
      // For now, just show all approved posts (can enhance with ranking later)
      query = query.not('media_type', 'is', null); // Only media posts
    }

    // Apply cursor pagination
    if (cursorData) {
      query = query.lt('created_at', cursorData.created_at);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // Check if there are more results
    const hasMore = (posts || []).length > limit;
    const items = (posts || []).slice(0, limit);

    // For each post, check if user has liked or bookmarked
    const postsWithInteractions = await Promise.all(
      items.map(async (post) => {
        // Check if liked
        const { data: likeData } = await supabaseClient
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();

        // Check if bookmarked
        const { data: bookmarkData } = await supabaseClient
          .from('bookmarks')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();

        // Check if following user
        const profileData = Array.isArray(post.user) ? post.user[0] : post.user;
        const { data: followData } = await supabaseClient
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', profileData?.user_id)
          .maybeSingle();

        // Get media renditions if available
        const { data: renditions } = await supabaseClient
          .from('media_renditions')
          .select('quality, storage_path, bitrate_kbps, width, height')
          .eq('post_id', post.id)
          .order('bitrate_kbps', { ascending: false });

        // Get CDN URLs for storage paths
        let mediaUrls: string[] = [];
        if (post.storage_path) {
          const bucket = post.media_type === 'photo' ? 'media-photos' : 'media-videos';
          
          if (bucket === 'media-photos') {
            const { data } = supabaseClient.storage.from(bucket).getPublicUrl(post.storage_path);
            mediaUrls = [data.publicUrl];
          } else {
            const { data, error } = await supabaseClient.storage
              .from(bucket)
              .createSignedUrl(post.storage_path, 3600);
            if (!error && data) {
              mediaUrls = [data.signedUrl];
            }
          }
        }

        
        return {
          id: post.id,
          user: {
            id: profileData?.user_id || '',
            full_name: profileData?.full_name || 'Unknown User',
            avatar_url: profileData?.avatar_url || null,
            is_following: !!followData,
          },
          content: post.content || '',
          title: post.title || '',
          media_type: post.media_type,
          storage_path: post.storage_path || '',
          media_urls: mediaUrls,
          renditions: renditions || [],
          thumbnail_url: post.thumbnail_url,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          view_count: post.view_count || 0,
          is_liked: !!likeData,
          is_bookmarked: !!bookmarkData,
          created_at: post.created_at,
        };
      })
    );

    // Generate next cursor
    const nextCursor = hasMore && items.length > 0
      ? btoa(JSON.stringify({
          id: items[items.length - 1].id,
          created_at: items[items.length - 1].created_at,
        }))
      : null;

    return new Response(
      JSON.stringify({
        data: postsWithInteractions,
        next_cursor: nextCursor,
        has_more: hasMore,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in feed-service:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

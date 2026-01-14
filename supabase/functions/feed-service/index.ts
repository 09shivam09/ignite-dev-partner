import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedRequest {
  type?: 'following' | 'discover' | 'events' | 'my_posts';
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
        user_id,
        post_engagement (
          engagement_score
        )
      `)
      .eq('moderation_status', 'approved')
      .limit(limit + 1); // Fetch one extra to determine has_more

    // Apply feed type filters
    if (type === 'my_posts') {
      // Show only the current user's posts
      query = query.eq('user_id', user.id);
      query = query.order('created_at', { ascending: false });
    } else if (type === 'following') {
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
      query = query.order('created_at', { ascending: false });
    } else if (type === 'events' && event_id) {
      query = query.eq('event_id', event_id);
      query = query.order('created_at', { ascending: false });
    } else if (type === 'discover') {
      // For discover feed, order by engagement score
      // Only show posts with media
      query = query.not('media_type', 'is', null);
      
      // Join with engagement scores and filter posts with score > 10
      const { data: topEngagements } = await supabaseClient
        .from('post_engagement')
        .select('post_id, engagement_score')
        .gte('engagement_score', 10) // Minimum score threshold
        .order('engagement_score', { ascending: false })
        .limit(100); // Get top 100 engaging posts

      if (topEngagements && topEngagements.length > 0) {
        const topPostIds = topEngagements.map(e => e.post_id);
        query = query.in('id', topPostIds);
      }
      
      // Note: We can't order by engagement_score directly in the query
      // We'll sort after fetching
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply cursor pagination
    if (cursorData) {
      query = query.lt('created_at', cursorData.created_at);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // For discover feed, sort by engagement score
    let sortedPosts = posts || [];
    if (type === 'discover') {
      sortedPosts.sort((a, b) => {
        const scoreA = Array.isArray(a.post_engagement) && a.post_engagement[0]
          ? a.post_engagement[0].engagement_score 
          : 0;
        const scoreB = Array.isArray(b.post_engagement) && b.post_engagement[0]
          ? b.post_engagement[0].engagement_score 
          : 0;
        return scoreB - scoreA;
      });
    }

    // Check if there are more results
    const hasMore = sortedPosts.length > limit;
    const items = sortedPosts.slice(0, limit);

    // For each post, check if user has liked or bookmarked
    const postsWithInteractions = await Promise.all(
      items.map(async (post) => {
        // Get profile data for the post user
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', post.user_id)
          .maybeSingle();

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
        const { data: followData } = await supabaseClient
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id)
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

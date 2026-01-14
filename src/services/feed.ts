import { supabase } from '@/integrations/supabase/client';

export interface FeedPost {
  id: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_following: boolean;
  };
  content: string;
  title: string | null;
  media_type: 'photo' | 'video' | 'reel' | 'text' | null;
  storage_path: string | null;
  media_urls: string[];
  thumbnail_url: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  created_at: string;
}

export type FeedType = 'following' | 'discover' | 'events' | 'my_posts' | 'all';

const ITEMS_PER_PAGE = 20;

// Fetch posts with pagination
export async function fetchFeed(
  type: FeedType = 'all',
  cursor?: string,
  eventId?: string
): Promise<{ data: FeedPost[]; nextCursor: string | null; hasMore: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
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
      user_id
    `)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(ITEMS_PER_PAGE + 1);

  // Apply filters based on feed type
  if (type === 'my_posts') {
    query = query.eq('user_id', user.id);
  } else if (type === 'following') {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    
    const followingIds = (follows || []).map(f => f.following_id);
    if (followingIds.length === 0) {
      return { data: [], nextCursor: null, hasMore: false };
    }
    query = query.in('user_id', followingIds);
  } else if (type === 'events' && eventId) {
    query = query.eq('event_id', eventId);
  } else if (type === 'discover') {
    query = query.not('media_type', 'is', null);
  }

  // Apply cursor pagination
  if (cursor) {
    const cursorData = JSON.parse(atob(cursor));
    query = query.lt('created_at', cursorData.created_at);
  }

  const { data: posts, error } = await query;
  
  if (error) throw error;

  const hasMore = (posts || []).length > ITEMS_PER_PAGE;
  const items = (posts || []).slice(0, ITEMS_PER_PAGE);

  // Enrich posts with user data and interaction status
  const enrichedPosts = await Promise.all(
    items.map(async (post) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_id', post.user_id)
        .maybeSingle();

      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .maybeSingle();

      // Get media URL
      let mediaUrls: string[] = [];
      if (post.storage_path) {
        const bucket = post.media_type === 'photo' ? 'media-photos' : 'media-videos';
        if (bucket === 'media-photos') {
          const { data } = supabase.storage.from(bucket).getPublicUrl(post.storage_path);
          mediaUrls = [data.publicUrl];
        } else {
          const { data } = await supabase.storage
            .from(bucket)
            .createSignedUrl(post.storage_path, 3600);
          if (data) {
            mediaUrls = [data.signedUrl];
          }
        }
      }

      return {
        id: post.id,
        user: {
          id: profile?.user_id || post.user_id,
          full_name: profile?.full_name || 'Unknown User',
          avatar_url: profile?.avatar_url || null,
          is_following: !!follow,
        },
        content: post.content || '',
        title: post.title,
        media_type: post.media_type as FeedPost['media_type'],
        storage_path: post.storage_path,
        media_urls: mediaUrls,
        thumbnail_url: post.thumbnail_url,
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        view_count: post.view_count || 0,
        is_liked: !!like,
        is_bookmarked: !!bookmark,
        created_at: post.created_at,
      };
    })
  );

  const nextCursor = hasMore && items.length > 0
    ? btoa(JSON.stringify({ created_at: items[items.length - 1].created_at }))
    : null;

  return {
    data: enrichedPosts,
    nextCursor,
    hasMore,
  };
}

// Create a new post
export async function createPost(data: {
  content: string;
  title?: string;
  mediaType?: 'photo' | 'video' | 'reel';
  storagePath?: string;
  thumbnailUrl?: string;
  eventId?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content: data.content,
      title: data.title || null,
      media_type: data.mediaType || 'text',
      storage_path: data.storagePath || null,
      thumbnail_url: data.thumbnailUrl || null,
      event_id: data.eventId || null,
      moderation_status: 'approved',
    })
    .select()
    .single();

  if (error) throw error;
  return post;
}

// Toggle like on a post
export async function toggleLike(postId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingLike) {
    // Unlike
    await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
    return false;
  } else {
    // Like
    await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: user.id });
    return true;
  }
}

// Add a comment
export async function addComment(postId: string, content: string, parentId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_comment_id: parentId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get comments for a post
export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('id, content, created_at, user_id, parent_comment_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Toggle bookmark
export async function toggleBookmark(postId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: existingBookmark } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingBookmark) {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);
    return false;
  } else {
    await supabase
      .from('bookmarks')
      .insert({ post_id: postId, user_id: user.id });
    return true;
  }
}

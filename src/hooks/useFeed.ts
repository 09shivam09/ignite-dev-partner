import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FeedType = 'following' | 'discover' | 'events' | 'my_posts';

export interface FeedPost {
  id: string;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_following: boolean;
  };
  content: string;
  title: string;
  media_type: string | null;
  storage_path?: string;
  media_urls: string[];
  renditions: Array<{
    quality: string;
    storage_path: string;
    bitrate_kbps: number | null;
    width: number | null;
    height: number | null;
  }>;
  thumbnail_url: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  created_at: string;
}

interface FeedResponse {
  data: FeedPost[];
  next_cursor: string | null;
  has_more: boolean;
}

export function useFeed(type: FeedType = 'following', eventId?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', type, eventId],
    queryFn: async ({ pageParam }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke<FeedResponse>('feed-service', {
        body: {
          type,
          cursor: pageParam,
          limit: 20,
          ...(eventId && { event_id: eventId }),
        },
      });

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage) => lastPage?.next_cursor ?? null,
    initialPageParam: null,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

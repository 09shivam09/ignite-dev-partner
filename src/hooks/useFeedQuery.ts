import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFeed, toggleLike, toggleBookmark } from '@/services/feed';
import type { FeedType, FeedPost } from '@/services/feed';

export function useFeedQuery(type: FeedType = 'all', eventId?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', type, eventId],
    queryFn: async ({ pageParam }) => {
      return fetchFeed(type, pageParam as string | undefined, eventId);
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useBookmarkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export type { FeedType, FeedPost };
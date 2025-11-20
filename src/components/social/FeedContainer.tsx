import { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { MediaCard } from './MediaCard';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus } from 'lucide-react';
import { useFeed, type FeedType } from '@/hooks/useFeed';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedContainerProps {
  type?: FeedType;
  eventId?: string;
  onCreatePost?: () => void;
}

export function FeedContainer({ type = 'following', eventId, onCreatePost }: FeedContainerProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useFeed(type, eventId);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Flatten pages into single array
  const posts = data?.pages.flatMap(page => page?.data || []) || [];

  // De-duplicate posts (in case of real-time updates)
  const uniquePosts = posts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prefetch thumbnails for next 3 posts
  useEffect(() => {
    const nextPosts = uniquePosts.slice(-3);
    nextPosts.forEach(post => {
      if (post.thumbnail_url) {
        const img = new Image();
        img.src = post.thumbnail_url;
      }
    });
  }, [uniquePosts]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 w-full" />
        ))}
      </div>
    );
  }

  if (uniquePosts.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title={
          type === 'following' 
            ? 'No posts from people you follow' 
            : 'No posts yet'
        }
        description={
          type === 'following'
            ? 'Follow users to see their posts here'
            : 'Be the first to share something!'
        }
        actionLabel="Create Post"
        onAction={onCreatePost}
      />
    );
  }

  return (
    <div className="space-y-6">
      {uniquePosts.map((post, index) => (
        <MediaCard 
          key={post.id} 
          post={post} 
          index={index}
          onUpdate={refetch}
        />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

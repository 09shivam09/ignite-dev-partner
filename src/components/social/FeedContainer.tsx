import { useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
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

  // Flatten pages into single array
  const posts = data?.pages.flatMap(page => page?.data || []) || [];

  // De-duplicate posts (in case of real-time updates)
  const uniquePosts = posts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );

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
    const emptyStateConfig = {
      following: {
        title: 'No posts from people you follow',
        description: 'Follow users to see their posts here',
      },
      my_posts: {
        title: "You haven't posted anything yet",
        description: 'Share your first photo, video, or reel!',
      },
      discover: {
        title: 'No posts to discover',
        description: 'Be the first to share something!',
      },
      events: {
        title: 'No event posts yet',
        description: 'Be the first to share something!',
      },
    };

    const config = emptyStateConfig[type] || emptyStateConfig.discover;

    return (
      <EmptyState
        icon={Plus}
        title={config.title}
        description={config.description}
        actionLabel="Create Post"
        onAction={onCreatePost}
      />
    );
  }

  return (
    <Virtuoso
      data={uniquePosts}
      endReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      overscan={200}
      itemContent={(index, post) => (
        <div className="mb-6">
          <MediaCard 
            post={post} 
            index={index}
            onUpdate={refetch}
          />
        </div>
      )}
      components={{
        Footer: () => (
          isFetchingNextPage ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null
        ),
      }}
    />
  );
}

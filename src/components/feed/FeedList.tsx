import { Virtuoso } from 'react-virtuoso';
import { Loader2, Plus } from 'lucide-react';
import { PostCard } from './PostCard';
import { ReelCard } from './ReelCard';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedQuery, FeedType, FeedPost } from '@/hooks/useFeedQuery';

interface FeedListProps {
  type?: FeedType;
  eventId?: string;
  onCreatePost?: () => void;
}

export function FeedList({ type = 'all', eventId, onCreatePost }: FeedListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useFeedQuery(type, eventId);

  // Flatten pages into single array
  const posts = data?.pages.flatMap(page => page?.data || []) || [];

  // De-duplicate posts
  const uniquePosts = posts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (uniquePosts.length === 0) {
    const emptyMessages: Record<FeedType, { title: string; description: string }> = {
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
      all: {
        title: 'No posts yet',
        description: 'Be the first to share something!',
      },
    };

    const config = emptyMessages[type] || emptyMessages.all;

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
      useWindowScroll
      endReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      overscan={200}
      itemContent={(index, post) => (
        <div className="mb-6">
          {post.media_type === 'reel' ? (
            <ReelCard post={post} onUpdate={refetch} />
          ) : (
            <PostCard post={post} onUpdate={refetch} />
          )}
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

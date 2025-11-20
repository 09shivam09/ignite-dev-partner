import { useState, useRef, useEffect } from 'react';
import { ReelPlayer } from './ReelPlayer';
import { CommentSection } from './CommentSection';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader2, Plus } from 'lucide-react';
import { useFeed, type FeedType } from '@/hooks/useFeed';
import { toast } from 'sonner';

interface ReelsFeedProps {
  type?: FeedType;
  eventId?: string;
  onCreatePost?: () => void;
}

export function ReelsFeed({ type = 'discover', eventId, onCreatePost }: ReelsFeedProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useFeed(type, eventId);

  // Flatten pages and filter for reels/videos only
  const reels = data?.pages
    .flatMap(page => page?.data || [])
    .filter(post => post.media_type === 'reel' || post.media_type === 'video') || [];

  // Snap scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const itemHeight = window.innerHeight;
        const newIndex = Math.round(scrollTop / itemHeight);
        
        setActiveIndex(newIndex);

        // Prefetch next page when near the end
        if (newIndex >= reels.length - 3 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [reels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prefetch next 2 reels
  useEffect(() => {
    const nextReels = reels.slice(activeIndex + 1, activeIndex + 3);
    nextReels.forEach(reel => {
      if (reel.thumbnail_url) {
        const img = new Image();
        img.src = reel.thumbnail_url;
      }
      
      // Prefetch video metadata
      if (reel.media_urls[0]) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = reel.media_urls[0];
      }
    });
  }, [activeIndex, reels]);

  const handleShare = async (post: typeof reels[0]) => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'Check out this reel',
          text: post.content,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <EmptyState
          icon={Plus}
          title="No reels yet"
          description="Be the first to share a reel!"
          actionLabel="Create Reel"
          onAction={onCreatePost}
        />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {reels.map((reel, index) => (
          <ReelPlayer
            key={reel.id}
            post={reel}
            isActive={index === activeIndex}
            onViewTracked={refetch}
            onShare={() => handleShare(reel)}
            onCommentClick={() => setCommentPostId(reel.id)}
          />
        ))}

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className="h-screen flex items-center justify-center bg-black snap-start">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Comments Sheet */}
      <Sheet open={!!commentPostId} onOpenChange={() => setCommentPostId(null)}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto h-full pb-20">
            {commentPostId && (
              <CommentSection postId={commentPostId} onUpdate={refetch} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

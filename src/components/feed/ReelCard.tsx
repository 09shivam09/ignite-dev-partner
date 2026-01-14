import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FeedPost } from '@/hooks/useFeedQuery';
import { toggleLike, toggleBookmark } from '@/services/feed';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CommentModal } from './CommentModal';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface ReelCardProps {
  post: FeedPost;
  onUpdate?: () => void;
  isFullscreen?: boolean;
}

export function ReelCard({ post, onUpdate, isFullscreen = false }: ReelCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { isIntersecting, ref: intersectionRef } = useIntersectionObserver({
    threshold: 0.6,
  });

  // Auto-play when visible
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isIntersecting) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isIntersecting]);

  // Track progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLike = async () => {
    const previousLiked = isLiked;
    const previousCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await toggleLike(post.id);
      onUpdate?.();
    } catch (error) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  const handleBookmark = async () => {
    const previousBookmarked = isBookmarked;
    setIsBookmarked(!isBookmarked);

    try {
      await toggleBookmark(post.id);
      toast.success(isBookmarked ? 'Removed from saved' : 'Saved!');
      onUpdate?.();
    } catch (error) {
      setIsBookmarked(previousBookmarked);
    }
  };

  const handleShare = async () => {
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
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied!');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    }
  };

  const mediaUrl = post.media_urls[0] || post.thumbnail_url;

  return (
    <>
      <Card 
        ref={intersectionRef}
        className={cn(
          'relative overflow-hidden bg-black',
          isFullscreen ? 'h-screen snap-start' : 'aspect-[9/16] max-h-[600px]'
        )}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={mediaUrl || undefined}
          poster={post.thumbnail_url || undefined}
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onClick={handlePlayPause}
        />

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <motion.div
            className="h-full bg-white"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Play/Pause Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20"
              onClick={handlePlayPause}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
              >
                <Play className="h-8 w-8" fill="white" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Info - Bottom Left */}
        <div className="absolute bottom-4 left-4 right-16 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-8 w-8 border-2 border-white">
              <AvatarImage src={post.user.avatar_url || undefined} />
              <AvatarFallback className="bg-white/20">
                {post.user.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm drop-shadow-lg">
              {post.user.full_name}
            </span>
            <span className="text-xs opacity-80">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          {post.content && (
            <p className="text-sm line-clamp-2 drop-shadow-lg">{post.content}</p>
          )}
        </div>

        {/* Action Buttons - Right Side */}
        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          >
            <div className="flex flex-col items-center">
              <Heart
                className={cn('h-6 w-6', isLiked && 'fill-red-500 text-red-500')}
              />
              <span className="text-[10px] mt-1">{likeCount}</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowComments(true)}
            className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          >
            <div className="flex flex-col items-center">
              <MessageCircle className="h-6 w-6" />
              <span className="text-[10px] mt-1">{post.comment_count}</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          >
            <Share2 className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          >
            <Bookmark className={cn('h-6 w-6', isBookmarked && 'fill-white')} />
          </Button>
        </div>

        {/* Mute Button - Bottom Right Corner */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMuteToggle}
          className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </Card>

      <CommentModal
        postId={post.id}
        open={showComments}
        onOpenChange={setShowComments}
        onUpdate={onUpdate}
      />
    </>
  );
}

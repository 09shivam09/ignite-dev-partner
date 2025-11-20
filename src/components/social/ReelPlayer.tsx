import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { LikeButton } from './LikeButton';
import { BookmarkButton } from './BookmarkButton';
import { FollowButton } from './FollowButton';
import type { FeedPost } from '@/hooks/useFeed';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReelPlayerProps {
  post: FeedPost;
  isActive?: boolean;
  onViewTracked?: () => void;
  onShare?: () => void;
  onCommentClick?: () => void;
}

export function ReelPlayer({ 
  post, 
  isActive = false,
  onViewTracked,
  onShare,
  onCommentClick,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(post.user.is_following);

  // Intersection observer for autoplay
  const { ref: containerRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
  });

  // Get the best video URL based on available renditions
  const getVideoUrl = () => {
    if (post.renditions.length > 0) {
      // Try to get 720p, fallback to highest quality available
      const preferred = post.renditions.find(r => r.quality === '720p');
      return preferred?.storage_path || post.renditions[0]?.storage_path || post.media_urls[0];
    }
    return post.media_urls[0];
  };

  // Autoplay logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isIntersecting && isActive) {
      video.play().catch(() => {
        // Auto-play was prevented, keep muted
        setIsPlaying(false);
      });
      setWatchStartTime(Date.now());
    } else {
      video.pause();
      setIsPlaying(false);
      
      // Track watch duration on pause
      if (watchStartTime && hasTrackedView) {
        const duration = (Date.now() - watchStartTime) / 1000;
        trackWatchDuration(duration);
      }
      setWatchStartTime(null);
    }
  }, [isIntersecting, isActive]);

  const trackView = async () => {
    if (hasTrackedView) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('media_views').insert({
        post_id: post.id,
        user_id: user?.id || null,
        device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      });

      setHasTrackedView(true);
      onViewTracked?.();
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackWatchDuration = async (durationSeconds: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const video = videoRef.current;
      const completed = video ? durationSeconds >= video.duration * 0.95 : false;

      await supabase
        .from('media_views')
        .update({
          watch_duration_seconds: durationSeconds,
          completed,
        })
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (error) {
      console.error('Error tracking watch duration:', error);
    }
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
      if (!hasTrackedView) {
        trackView();
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen snap-start snap-always bg-black flex items-center justify-center"
    >
      <video
        ref={videoRef}
        src={getVideoUrl()}
        poster={post.thumbnail_url || undefined}
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onPlay={() => {
          setIsPlaying(true);
          if (!hasTrackedView) trackView();
        }}
        onPause={() => setIsPlaying(false)}
      />

      {/* Overlay Controls */}
      <div className="absolute inset-0 flex items-end justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-black/20">
        {/* Left Side - User Info & Content */}
        <div className="flex-1 space-y-3 pb-20">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white">
              <AvatarImage src={post.user.avatar_url || undefined} />
              <AvatarFallback>{post.user.full_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{post.user.full_name}</p>
            </div>
            {!isFollowing && (
              <FollowButton
                userId={post.user.id}
                isFollowing={isFollowing}
                onFollowChange={setIsFollowing}
                size="sm"
              />
            )}
          </div>

          {post.title && (
            <h3 className="text-lg font-bold text-white">{post.title}</h3>
          )}
          {post.content && (
            <p className="text-sm text-white/90 line-clamp-3">{post.content}</p>
          )}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex flex-col items-center gap-6 pb-20">
          <div className="flex flex-col items-center gap-1">
            <LikeButton
              postId={post.id}
              initialLikes={post.like_count}
              initialLiked={post.is_liked}
            />
          </div>

          <button
            onClick={onCommentClick}
            className="flex flex-col items-center gap-1 text-white"
          >
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-colors">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="text-xs">{post.comment_count}</span>
          </button>

          <button
            onClick={onShare}
            className="flex flex-col items-center gap-1 text-white"
          >
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-colors">
              <Share2 className="h-6 w-6" />
            </div>
          </button>

          <div className="flex flex-col items-center gap-1">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
              <BookmarkButton
                postId={post.id}
                isBookmarked={post.is_bookmarked}
                variant="ghost"
                size="icon"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Play/Pause Button */}
      {!isPlaying && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full hover:bg-white/30 transition-colors">
            <Play className="h-12 w-12 text-white" fill="white" />
          </div>
        </button>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30"
          onClick={toggleFullscreen}
        >
          <Maximize className="h-5 w-5" />
        </Button>
      </div>

      {/* View Count */}
      {post.view_count > 0 && (
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
          <p className="text-xs text-white">
            {post.view_count.toLocaleString()} views
          </p>
        </div>
      )}
    </div>
  );
}

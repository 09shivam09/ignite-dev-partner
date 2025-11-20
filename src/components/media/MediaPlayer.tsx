import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPlayerProps {
  postId: string;
  mediaType: 'photo' | 'reel' | 'video';
  storagePath: string;
  thumbnailUrl?: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
  onViewTracked?: () => void;
}

export const MediaPlayer = ({
  postId,
  mediaType,
  storagePath,
  thumbnailUrl,
  autoPlay = false,
  muted = true,
  className,
  onViewTracked,
}: MediaPlayerProps) => {
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const bucket = mediaType === 'photo' ? 'media-photos' : 'media-videos';
        
        // For public buckets, use getPublicUrl
        if (bucket === 'media-photos') {
          const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
          setMediaUrl(data.publicUrl);
        } else {
          // For private buckets, use createSignedUrl
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(storagePath, 3600); // 1 hour expiry

          if (error) throw error;
          setMediaUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error loading media:', error);
      }
    };

    loadMedia();
  }, [mediaType, storagePath]);

  const trackView = async () => {
    if (hasTrackedView) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('media_views').insert({
        post_id: postId,
        user_id: user?.id || null,
        device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      });

      setHasTrackedView(true);
      onViewTracked?.();
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      trackView();
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (mediaType === 'photo') {
    return (
      <div className={cn("relative rounded-lg overflow-hidden bg-muted", className)}>
        {mediaUrl && (
          <img
            src={mediaUrl}
            alt="Post media"
            loading="lazy"
            className="w-full h-full object-cover"
            onLoad={trackView}
          />
        )}
      </div>
    );
  }

  return (
    <Card className={cn("relative rounded-lg overflow-hidden bg-black", className)}>
      <video
        ref={videoRef}
        src={mediaUrl}
        poster={thumbnailUrl}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={mediaType === 'reel'}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Video Controls Overlay */}
      <div className="absolute inset-0 flex items-center justify-center group hover:bg-black/20 transition-colors">
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={isPlaying ? handlePause : handlePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Play button center overlay when paused */}
        {!isPlaying && (
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
            onClick={handlePlay}
          >
            <Play className="h-8 w-8" />
          </Button>
        )}
      </div>
    </Card>
  );
};

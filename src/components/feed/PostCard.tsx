import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, MoreVertical, Bookmark, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { CommentModal } from './CommentModal';
import type { FeedPost } from '@/services/feed';
import { toggleLike, toggleBookmark } from '@/services/feed';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: FeedPost;
  onUpdate?: () => void;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
  const [showComments, setShowComments] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const handleLike = async () => {
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await toggleLike(post.id);
      onUpdate?.();
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error('Failed to update like');
    } finally {
      setIsLikeLoading(false);
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
      toast.error('Failed to update bookmark');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'Check out this post',
          text: post.content,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const getMediaUrl = () => {
    if (post.media_urls.length > 0) return post.media_urls[0];
    if (post.thumbnail_url) return post.thumbnail_url;
    return null;
  };

  const mediaUrl = getMediaUrl();

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.user.avatar_url || undefined} />
                <AvatarFallback>
                  {post.user.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{post.user.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Media Content */}
        {mediaUrl && (
          <CardContent className="p-0">
            {post.media_type === 'photo' ? (
              <img
                src={mediaUrl}
                alt={post.title || 'Post image'}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
            ) : post.media_type === 'video' ? (
              <video
                src={mediaUrl}
                poster={post.thumbnail_url || undefined}
                controls
                playsInline
                className="w-full aspect-video object-cover"
              />
            ) : null}
          </CardContent>
        )}

        {/* Text Content (if no media or as caption) */}
        {(post.content && (!mediaUrl || post.media_type === 'text')) && (
          <CardContent className={cn(mediaUrl ? 'pt-3' : 'py-4')}>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-3 pt-0 pb-3">
          {/* Action Buttons */}
          <div className="flex items-center w-full">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLikeLoading}
                className="gap-1 px-2"
              >
                <motion.div
                  animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={cn(
                      'h-5 w-5',
                      isLiked && 'fill-red-500 text-red-500'
                    )}
                  />
                </motion.div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(true)}
                className="gap-1 px-2"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-1 px-2"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className="px-2"
            >
              <Bookmark
                className={cn(
                  'h-5 w-5',
                  isBookmarked && 'fill-foreground'
                )}
              />
            </Button>
          </div>

          {/* Engagement Stats */}
          <div className="w-full space-y-1 px-1">
            <p className="text-sm font-semibold">{likeCount.toLocaleString()} likes</p>
            {post.content && mediaUrl && (
              <p className="text-sm">
                <span className="font-semibold">{post.user.full_name}</span>{' '}
                {post.content.length > 100 ? `${post.content.slice(0, 100)}...` : post.content}
              </p>
            )}
            {post.comment_count > 0 && (
              <button
                onClick={() => setShowComments(true)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                View all {post.comment_count} comments
              </button>
            )}
          </div>
        </CardFooter>
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

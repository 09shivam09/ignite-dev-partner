import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LikeButton } from './LikeButton';
import { BookmarkButton } from './BookmarkButton';
import { FollowButton } from './FollowButton';
import { CommentSection } from './CommentSection';
import { MediaPlayer } from '@/components/media/MediaPlayer';
import { useState } from 'react';
import type { FeedPost } from '@/hooks/useFeed';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MediaCardProps {
  post: FeedPost;
  index?: number;
  onUpdate?: () => void;
}

export function MediaCard({ post, index = 0, onUpdate }: MediaCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.user.is_following);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`;
    
    // Track share in backend
    try {
      await supabase.functions.invoke('share-post', {
        body: { post_id: post.id },
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'Check out this post',
          text: post.content,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user.avatar_url || undefined} />
              <AvatarFallback>{post.user.full_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.user.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {!isFollowing && (
            <FollowButton
              userId={post.user.id}
              isFollowing={isFollowing}
              onFollowChange={setIsFollowing}
              variant="outline"
              size="sm"
            />
          )}
        </div>
        {post.title && (
          <h3 className="font-semibold mt-2">{post.title}</h3>
        )}
        {post.content && post.media_type !== 'text' && (
          <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {post.media_type && post.media_type !== 'text' && post.storage_path ? (
          <MediaPlayer
            postId={post.id}
            mediaType={post.media_type as 'photo' | 'reel' | 'video'}
            storagePath={post.storage_path}
            thumbnailUrl={post.thumbnail_url || undefined}
            autoPlay={false}
            onViewTracked={onUpdate}
          />
        ) : (
          <div className="p-6 bg-muted/30">
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3">
        {/* Engagement Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground w-full">
          <span>{post.like_count.toLocaleString()} likes</span>
          <span>{post.comment_count} comments</span>
          {post.view_count > 0 && (
            <span>{post.view_count.toLocaleString()} views</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full border-t pt-3">
          <LikeButton
            postId={post.id}
            initialLikes={post.like_count}
            initialLiked={post.is_liked}
            onUpdate={onUpdate}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <div className="flex-1" />
          <BookmarkButton
            postId={post.id}
            isBookmarked={post.is_bookmarked}
            onBookmarkChange={onUpdate}
          />
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="w-full pt-3 border-t">
            <CommentSection postId={post.id} onUpdate={onUpdate} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

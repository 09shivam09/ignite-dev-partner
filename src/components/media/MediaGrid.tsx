import { MediaPlayer } from "./MediaPlayer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/social/LikeButton";
import { CommentSection } from "@/components/social/CommentSection";
import { Button } from "@/components/ui/button";
import { MessageCircle, Eye, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MediaGridProps {
  eventId?: string;
  mediaType?: 'photo' | 'reel' | 'video';
}

const POSTS_PER_PAGE = 12;

export const MediaGrid = ({ eventId, mediaType }: MediaGridProps) => {
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: posts, isLoading, isFetching } = useQuery({
    queryKey: ['media-posts', eventId, mediaType, page],
    queryFn: async () => {
      const from = page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      if (mediaType) {
        query = query.eq('media_type', mediaType);
      } else {
        query = query.not('media_type', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Append new posts to allPosts
  useEffect(() => {
    if (posts && posts.length > 0) {
      setAllPosts(prev => {
        const newPosts = posts.filter(p => !prev.some(existing => existing.id === p.id));
        return [...prev, ...newPosts];
      });
    }
  }, [posts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && posts && posts.length === POSTS_PER_PAGE && !isFetching) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [posts, isFetching]);

  // Reset on filter change
  useEffect(() => {
    setPage(0);
    setAllPosts([]);
  }, [eventId, mediaType]);

  const getMediaTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'bg-blue-500';
      case 'reel': return 'bg-purple-500';
      case 'video': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProcessingBadge = (status: string) => {
    switch (status) {
      case 'uploading': return <Badge variant="secondary">Uploading...</Badge>;
      case 'processing': return <Badge variant="secondary">Processing...</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return null;
    }
  };

  if (isLoading && page === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allPosts.map((post, index) => {
          const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
          
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>{profile?.full_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {profile?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getProcessingBadge(post.processing_status)}
                      <Badge className={getMediaTypeColor(post.media_type)}>
                        {post.media_type}
                      </Badge>
                    </div>
                  </div>
                  {post.title && (
                    <h3 className="text-sm font-semibold mt-2">{post.title}</h3>
                  )}
                </CardHeader>

                <CardContent className="p-0">
                  {post.media_type !== 'text' && post.storage_path ? (
                    <MediaPlayer
                      postId={post.id}
                      mediaType={post.media_type as 'photo' | 'reel' | 'video'}
                      storagePath={post.storage_path}
                      thumbnailUrl={post.thumbnail_url}
                      autoPlay={false}
                      className="aspect-square"
                    />
                  ) : (
                    <div className="p-4 bg-muted/50">
                      <p className="text-sm">{post.content}</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-3">
                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground w-full">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.view_count?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comment_count || 0}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 w-full">
                    <LikeButton
                      postId={post.id}
                      initialLikes={post.like_count || 0}
                      onUpdate={() => {}}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedComments(
                        expandedComments === post.id ? null : post.id
                      )}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments === post.id && (
                    <div className="w-full pt-3 border-t">
                      <CommentSection postId={post.id} onUpdate={() => {}} />
                    </div>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-8">
        {isFetching && page > 0 && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
};
import { MediaPlayer } from "./MediaPlayer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/social/LikeButton";
import { CommentSection } from "@/components/social/CommentSection";
import { Button } from "@/components/ui/button";
import { MessageCircle, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";

interface MediaPost {
  id: string;
  user_id: string;
  media_type: string;
  title?: string;
  content: string;
  storage_path?: string;
  thumbnail_url?: string;
  processing_status: string;
  moderation_status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | {
    full_name: string | null;
    avatar_url: string | null;
  }[];
}

interface MediaGridProps {
  posts: MediaPost[];
  onUpdate?: () => void;
}

export const MediaGrid = ({ posts, onUpdate }: MediaGridProps) => {
  const [expandedComments, setExpandedComments] = useState<string | null>(null);

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post, index) => (
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
                    <AvatarImage src={
                      Array.isArray(post.profiles) 
                        ? post.profiles[0]?.avatar_url || undefined
                        : post.profiles?.avatar_url || undefined
                    } />
                    <AvatarFallback>
                      {Array.isArray(post.profiles)
                        ? post.profiles[0]?.full_name?.[0] || 'U'
                        : post.profiles?.full_name?.[0] || 'U'
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {Array.isArray(post.profiles)
                        ? post.profiles[0]?.full_name || 'Unknown User'
                        : post.profiles?.full_name || 'Unknown User'
                      }
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
                  onViewTracked={onUpdate}
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
                  <span>{post.view_count.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comment_count}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full">
                <LikeButton
                  postId={post.id}
                  initialLikes={post.like_count}
                  onUpdate={onUpdate}
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
                  <CommentSection
                    postId={post.id}
                    onUpdate={onUpdate}
                  />
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

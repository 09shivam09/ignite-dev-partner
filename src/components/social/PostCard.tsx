import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { LikeButton } from "./LikeButton";
import { CommentSection } from "./CommentSection";
import { supabase } from "@/integrations/supabase/client";

interface PostCardProps {
  post: any;
  onUpdate: () => void;
}

export const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  });

  const profile = post.profiles || {};
  const likesCount = post.likes?.[0]?.count || 0;
  const commentsCount = post.comments?.[0]?.count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>
                {profile.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile.full_name || "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

          {/* Media Gallery */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.media_urls.map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="rounded-lg object-cover w-full h-48"
                />
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-4 border-t">
          {/* Actions */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <LikeButton
                postId={post.id}
                initialLikes={likesCount}
                onUpdate={onUpdate}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{commentsCount}</span>
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <CommentSection
              postId={post.id}
              onUpdate={onUpdate}
            />
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

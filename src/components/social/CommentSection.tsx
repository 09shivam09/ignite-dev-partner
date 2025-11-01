import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface CommentSectionProps {
  postId: string;
  onUpdate: () => void;
}

export const CommentSection = ({ postId, onUpdate }: CommentSectionProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        profiles!comments_user_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    setComments(data || []);
  };

  const handleSubmitComment = async (parentId?: string) => {
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to comment");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
        parent_comment_id: parentId || null,
      });

      if (error) throw error;

      setNewComment("");
      setReplyingTo(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  const renderComment = (comment: any, isReply = false) => {
    const profile = comment.profiles || {};
    const replies = comments.filter((c) => c.parent_comment_id === comment.id);

    return (
      <motion.div
        key={comment.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`space-y-2 ${isReply ? "ml-12" : ""}`}
      >
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>
              {profile.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="bg-muted rounded-lg p-3">
              <p className="font-semibold text-sm">
                {profile.full_name || "Anonymous"}
              </p>
              <p className="text-sm">{comment.content}</p>
            </div>
            <div className="flex items-center space-x-4 text-xs text-muted-foreground px-3">
              <span>
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setReplyingTo(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            </div>

            {/* Reply Input */}
            {replyingTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center space-x-2 mt-2"
              >
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment(comment.id);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => handleSubmitComment(comment.id)}
                  disabled={loading || !newComment.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {replies.length > 0 && (
          <AnimatePresence>
            {replies.map((reply) => renderComment(reply, true))}
          </AnimatePresence>
        )}
      </motion.div>
    );
  };

  const topLevelComments = comments.filter((c) => !c.parent_comment_id);

  return (
    <div className="space-y-4 w-full">
      {/* Comment Input */}
      <div className="flex items-center space-x-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
        />
        <Button
          size="sm"
          onClick={() => handleSubmitComment()}
          disabled={loading || !newComment.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments List */}
      <AnimatePresence>
        {topLevelComments.map((comment) => renderComment(comment))}
      </AnimatePresence>
    </div>
  );
};

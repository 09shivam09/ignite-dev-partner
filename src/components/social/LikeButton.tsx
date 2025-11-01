import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  onUpdate: () => void;
}

export const LikeButton = ({ postId, initialLikes, onUpdate }: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkIfLiked();
    fetchLikesCount();
  }, [postId]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`likes-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchLikesCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const checkIfLiked = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    setIsLiked(!!data);
  };

  const fetchLikesCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    setLikesCount(count || 0);
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        // Unlike - optimistic update
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));

        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like - optimistic update
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);

        const { error } = await supabase
          .from("likes")
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;
      }

      onUpdate();
    } catch (error: any) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(initialLikes);
      toast.error(error.message || "Failed to update like");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className="gap-2"
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
        />
      </motion.div>
      <span>{likesCount}</span>
    </Button>
  );
};

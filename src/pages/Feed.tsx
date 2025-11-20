import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Grid3x3, List } from "lucide-react";
import { PostCard } from "@/components/social/PostCard";
import { MediaGrid } from "@/components/media/MediaGrid";
import { CreatePostModal } from "@/components/social/CreatePostModal";
import { MediaUploader } from "@/components/media/MediaUploader";
import { NotificationDrawer } from "@/components/social/NotificationDrawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { toast } from "sonner";

const POSTS_PER_PAGE = 10;

export default function Feed() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === POSTS_PER_PAGE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Feed refreshed!");
  };

  const posts = data?.pages.flatMap((page) => page) || [];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Social Feed</h1>
            <p className="text-muted-foreground">Connect with the community</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePullToRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3x3 className="h-4 w-4" />
              )}
            </Button>
            <NotificationDrawer />
            <Button 
              variant={isMediaUploadOpen ? "secondary" : "default"}
              onClick={() => setIsMediaUploadOpen(!isMediaUploadOpen)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isMediaUploadOpen ? 'Cancel Upload' : 'Upload Media'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Text Post
            </Button>
          </div>
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No posts yet"
            description="Be the first to share something with the community!"
            actionLabel="Create Post"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : viewMode === 'grid' ? (
          <MediaGrid posts={posts} onUpdate={refetch} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={refetch} />
            ))}
          </motion.div>
        )}

        {/* Load More */}
        {hasNextPage && (
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        )}

        {/* Media Upload Section */}
        {isMediaUploadOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <MediaUploader
              onSuccess={() => {
                refetch();
                setIsMediaUploadOpen(false);
                toast.success('Media uploaded successfully!');
              }}
            />
          </motion.div>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={refetch}
        />
      </div>
    </AppLayout>
  );
}

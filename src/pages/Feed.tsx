import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Play } from "lucide-react";
import { FeedList } from "@/components/feed/FeedList";
import { CreatePost } from "@/components/feed/CreatePost";
import { DevTools } from "@/components/feed/DevTools";
import { TrendingSection } from "@/components/social/TrendingSection";
import { ReelsFeed } from "@/components/social/ReelsFeed";
import { NotificationDrawer } from "@/components/social/NotificationDrawer";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useFeedQuery } from "@/hooks/useFeedQuery";
import type { FeedType } from "@/services/feed";

export default function Feed() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedType, setFeedType] = useState<FeedType>('discover');
  const [viewMode, setViewMode] = useState<'feed' | 'reels'>('feed');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { refetch } = useFeedQuery(feedType);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Feed refreshed!");
  };

  const handlePostCreated = () => {
    setIsCreateOpen(false);
    refetch();
    toast.success("Post created successfully!");
  };

  return (
    <AppLayout>
      {viewMode === 'reels' ? (
        <ReelsFeed 
          type={feedType}
          onCreatePost={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Feed</h1>
              <p className="text-muted-foreground text-sm">Share moments with the community</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'feed' ? 'reels' : 'feed')}
                title={viewMode === 'feed' ? 'Switch to Reels' : 'Switch to Feed'}
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <NotificationDrawer />
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>

          {/* Dev Tools - For seeding dummy content */}
          <DevTools onSeedComplete={() => refetch()} />

          {/* Create Post Section */}
          {isCreateOpen && (
            <CreatePost 
              onSuccess={handlePostCreated}
              onCancel={() => setIsCreateOpen(false)}
            />
          )}

          {/* Trending Section - Only show on Discover tab */}
          {feedType === 'discover' && (
            <TrendingSection />
          )}

          {/* Feed Type Tabs */}
          <Tabs value={feedType} onValueChange={(v) => setFeedType(v as FeedType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="following" className="text-xs sm:text-sm">Following</TabsTrigger>
              <TabsTrigger value="discover" className="text-xs sm:text-sm">Discover</TabsTrigger>
              <TabsTrigger value="my_posts" className="text-xs sm:text-sm">My Posts</TabsTrigger>
              <TabsTrigger value="events" className="text-xs sm:text-sm">Events</TabsTrigger>
            </TabsList>
            
            <TabsContent value="following" className="mt-6">
              <FeedList 
                type="following" 
                onCreatePost={() => setIsCreateOpen(true)}
              />
            </TabsContent>
            
            <TabsContent value="discover" className="mt-6">
              <FeedList 
                type="discover" 
                onCreatePost={() => setIsCreateOpen(true)}
              />
            </TabsContent>
            
            <TabsContent value="my_posts" className="mt-6">
              <FeedList 
                type="my_posts" 
                onCreatePost={() => setIsCreateOpen(true)}
              />
            </TabsContent>
            
            <TabsContent value="events" className="mt-6">
              <FeedList 
                type="events" 
                onCreatePost={() => setIsCreateOpen(true)}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </AppLayout>
  );
}

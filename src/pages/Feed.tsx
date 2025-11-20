import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { FeedContainer } from "@/components/social/FeedContainer";
import { CreatePostModal } from "@/components/social/CreatePostModal";
import { MediaUploader } from "@/components/media/MediaUploader";
import { NotificationDrawer } from "@/components/social/NotificationDrawer";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useFeed, type FeedType } from "@/hooks/useFeed";

export default function Feed() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);
  const [feedType, setFeedType] = useState<FeedType>('following');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { refetch } = useFeed(feedType);

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Feed refreshed!");
  };

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

        {/* Feed Type Tabs */}
        <Tabs value={feedType} onValueChange={(v) => setFeedType(v as FeedType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="following" className="mt-6">
            <FeedContainer 
              type="following" 
              onCreatePost={() => setIsCreateModalOpen(true)}
            />
          </TabsContent>
          
          <TabsContent value="discover" className="mt-6">
            <FeedContainer 
              type="discover" 
              onCreatePost={() => setIsCreateModalOpen(true)}
            />
          </TabsContent>
          
          <TabsContent value="events" className="mt-6">
            <FeedContainer 
              type="events" 
              onCreatePost={() => setIsCreateModalOpen(true)}
            />
          </TabsContent>
        </Tabs>

        {/* Media Upload Section */}
        {isMediaUploadOpen && (
          <div className="mt-6">
            <MediaUploader
              onSuccess={() => {
                refetch();
                setIsMediaUploadOpen(false);
                toast.success('Media uploaded successfully!');
              }}
            />
          </div>
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
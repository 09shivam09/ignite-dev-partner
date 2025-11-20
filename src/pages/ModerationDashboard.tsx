import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MediaPlayer } from "@/components/media/MediaPlayer";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function ModerationDashboard() {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: queueItems, isLoading } = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_queue")
        .select(`
          *,
          posts!inner (
            *,
            profiles!posts_user_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq("action", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ 
      queueId, 
      postId, 
      action 
    }: { 
      queueId: string; 
      postId: string; 
      action: 'approve' | 'reject';
    }) => {
      // Update moderation queue
      const { error: queueError } = await supabase
        .from("moderation_queue")
        .update({
          action,
          reviewed_at: new Date().toISOString(),
          notes: reviewNotes,
        })
        .eq("id", queueId);

      if (queueError) throw queueError;

      // Update post status
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const { error: postError } = await supabase
        .from("posts")
        .update({
          moderation_status: newStatus,
        })
        .eq("id", postId);

      if (postError) throw postError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      toast.success(
        variables.action === 'approve' 
          ? 'Content approved' 
          : 'Content rejected'
      );
      setSelectedItem(null);
      setReviewNotes("");
    },
    onError: (error) => {
      console.error('Moderation error:', error);
      toast.error('Failed to moderate content');
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
            <p className="text-muted-foreground">
              Review flagged content and take action
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {queueItems?.length || 0} pending
          </Badge>
        </div>

        {queueItems?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">
                No content pending moderation
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {queueItems?.map((item) => {
              const post = item.posts;
              const isSelected = selectedItem === item.id;

              return (
                <Card 
                  key={item.id}
                  className={isSelected ? 'ring-2 ring-primary' : ''}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {post.title || 'Untitled Post'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {item.flagged_reason}
                          </Badge>
                          <Badge variant="outline">
                            {(item.confidence_score * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          By {
                            Array.isArray((post as any).profiles) 
                              ? ((post as any).profiles[0]?.full_name || 'Unknown')
                              : ((post as any).profiles?.full_name || 'Unknown')
                          } • 
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Media Preview */}
                    {post.media_type !== 'text' && post.storage_path && (
                      <MediaPlayer
                        postId={post.id}
                        mediaType={post.media_type as 'photo' | 'reel' | 'video'}
                        storagePath={post.storage_path}
                        thumbnailUrl={post.thumbnail_url}
                        className="aspect-video"
                      />
                    )}

                    {/* Content */}
                    {post.content && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{post.content}</p>
                      </div>
                    )}

                    {/* AI Reason */}
                    {item.notes && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <p className="text-sm font-medium mb-1">AI Detection:</p>
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      </div>
                    )}

                    {/* Review Notes */}
                    {isSelected && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Review Notes (optional)
                        </label>
                        <Textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Add notes about your decision..."
                          className="min-h-20"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {!isSelected ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setSelectedItem(item.id)}
                        >
                          Review
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => moderateMutation.mutate({
                              queueId: item.id,
                              postId: post.id,
                              action: 'approve',
                            })}
                            disabled={moderateMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => moderateMutation.mutate({
                              queueId: item.id,
                              postId: post.id,
                              action: 'reject',
                            })}
                            disabled={moderateMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setSelectedItem(null);
                              setReviewNotes("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

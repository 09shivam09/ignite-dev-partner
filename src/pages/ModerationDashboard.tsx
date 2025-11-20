import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, Eye, Calendar, User, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { MediaPlayer } from '@/components/media/MediaPlayer';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function ModerationDashboard() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const queryClient = useQueryClient();

  // Fetch moderation queue
  const { data: queueItems, isLoading: queueLoading } = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_queue')
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
        .is('reviewed_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          posts!inner (
            id,
            title,
            content,
            media_type,
            thumbnail_url,
            created_at,
            profiles!posts_user_id_fkey (
              full_name,
              avatar_url
            )
          ),
          reporter:profiles!reports_reporter_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  // Group reports by post
  const groupedReports = reports?.reduce((acc, report) => {
    const postId = report.post_id;
    if (!acc[postId]) {
      acc[postId] = [];
    }
    acc[postId].push(report);
    return acc;
  }, {} as Record<string, typeof reports>);

  const moderateMutation = useMutation({
    mutationFn: async ({
      queueId,
      postId,
      action,
    }: {
      queueId: string;
      postId: string;
      action: 'approve' | 'reject';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Update moderation queue
      const { error: queueError } = await supabase
        .from('moderation_queue')
        .update({
          action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          notes: reviewNotes,
        })
        .eq('id', queueId);

      if (queueError) throw queueError;

      // Update post status
      const { error: postError } = await supabase
        .from('posts')
        .update({ moderation_status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', postId);

      if (postError) throw postError;
    },
    onSuccess: (_, variables) => {
      toast.success(`Post ${variables.action === 'approve' ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSelectedItem(null);
      setReviewNotes('');
    },
    onError: (error) => {
      console.error('Error handling moderation:', error);
      toast.error('Failed to process moderation action');
    },
  });

  const handleReportAction = async (reportIds: string[], action: 'resolve' | 'dismiss', postId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update all reports
      const { error } = await supabase
        .from('reports')
        .update({
          status: action === 'resolve' ? 'resolved' : 'dismissed',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .in('id', reportIds);

      if (error) throw error;

      // If resolving, also remove the post
      if (action === 'resolve' && postId) {
        const { error: postError } = await supabase
          .from('posts')
          .update({ moderation_status: 'rejected' })
          .eq('id', postId);

        if (postError) throw postError;
      }

      toast.success(`Reports ${action === 'resolve' ? 'resolved and post removed' : 'dismissed'}`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
    } catch (error) {
      console.error('Error handling report:', error);
      toast.error('Failed to process report');
    }
  };

  const isLoading = queueLoading || reportsLoading;

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
              Review flagged content and user reports
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <AlertTriangle className="h-4 w-4 mr-2" />
              {queueItems?.length || 0} queued
            </Badge>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              <User className="h-4 w-4 mr-2" />
              {reports?.length || 0} reports
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queue">Moderation Queue</TabsTrigger>
            <TabsTrigger value="reports">User Reports</TabsTrigger>
          </TabsList>

          {/* Moderation Queue Tab */}
          <TabsContent value="queue" className="mt-6">
            {queueItems?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">No content pending moderation</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {queueItems?.map((item) => {
                  const post = Array.isArray(item.posts) ? item.posts[0] : item.posts;
                  const profile = Array.isArray(post?.profiles) ? post.profiles[0] : post?.profiles;
                  const isSelected = selectedItem === item.id;

                  return (
                    <Card key={item.id} className={isSelected ? 'ring-2 ring-primary' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {post?.title || 'Untitled Post'}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {item.flagged_reason}
                              </Badge>
                              {item.confidence_score && (
                                <Badge variant="outline">
                                  {(item.confidence_score * 100).toFixed(0)}% confidence
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              By {profile?.full_name || 'Unknown'} •{' '}
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Media Preview */}
                        {post?.media_type !== 'text' && post?.storage_path && (
                          <MediaPlayer
                            postId={post.id}
                            mediaType={post.media_type as 'photo' | 'reel' | 'video'}
                            storagePath={post.storage_path}
                            thumbnailUrl={post.thumbnail_url}
                            className="aspect-video"
                          />
                        )}

                        {/* Content */}
                        {post?.content && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm">{post.content}</p>
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
                              maxLength={500}
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
                                onClick={() =>
                                  moderateMutation.mutate({
                                    queueId: item.id,
                                    postId: post.id,
                                    action: 'approve',
                                  })
                                }
                                disabled={moderateMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() =>
                                  moderateMutation.mutate({
                                    queueId: item.id,
                                    postId: post.id,
                                    action: 'reject',
                                  })
                                }
                                disabled={moderateMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setSelectedItem(null);
                                  setReviewNotes('');
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
          </TabsContent>

          {/* User Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            {!groupedReports || Object.keys(groupedReports).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports</h3>
                  <p className="text-muted-foreground">No user reports pending review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedReports).map(([postId, postReports]) => {
                  const firstReport = postReports[0];
                  const post = Array.isArray(firstReport.posts) ? firstReport.posts[0] : firstReport.posts;
                  const profile = Array.isArray(post?.profiles) ? post.profiles[0] : post?.profiles;

                  return (
                    <Card key={postId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle>{post?.title || 'Untitled Post'}</CardTitle>
                            <CardDescription>
                              By {profile?.full_name || 'Unknown'} •{' '}
                              Posted {formatDistanceToNow(new Date(post?.created_at || Date.now()), { addSuffix: true })}
                            </CardDescription>
                            <Badge variant="destructive">
                              {postReports.length} {postReports.length === 1 ? 'Report' : 'Reports'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Post Content */}
                        {post?.content && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm">{post.content}</p>
                          </div>
                        )}

                        {/* Reports List */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">Reports:</h4>
                          {postReports.map((report) => {
                            const reporter = Array.isArray(report.reporter) ? report.reporter[0] : report.reporter;
                            return (
                              <div key={report.id} className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge>{report.reason}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    by {reporter?.full_name || 'Anonymous'} •{' '}
                                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                  </span>
                                </div>
                                {report.description && (
                                  <p className="text-sm text-muted-foreground">{report.description}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleReportAction(
                                postReports.map((r) => r.id),
                                'resolve',
                                postId
                              )
                            }
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Remove Post & Resolve Reports
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleReportAction(
                                postReports.map((r) => r.id),
                                'dismiss'
                              )
                            }
                          >
                            Dismiss Reports
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

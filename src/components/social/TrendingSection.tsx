import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface TrendingPost {
  id: string;
  title: string;
  content: string;
  thumbnail_url: string | null;
  media_type: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
  engagement_score: number;
}

export function TrendingSection() {
  const { data: trendingPosts, isLoading } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: async () => {
      // Get top 5 trending posts from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: engagements, error: engError } = await supabase
        .from('post_engagement')
        .select('post_id, engagement_score')
        .gte('updated_at', oneDayAgo)
        .order('engagement_score', { ascending: false })
        .limit(5);

      if (engError) throw engError;
      if (!engagements || engagements.length === 0) return [];

      const postIds = engagements.map(e => e.post_id);

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          thumbnail_url,
          media_type,
          like_count,
          comment_count,
          view_count,
          created_at,
          profiles!posts_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .in('id', postIds)
        .eq('moderation_status', 'approved');

      if (error) throw error;

      // Map engagement scores to posts
      return (posts || []).map(post => {
        const engagement = engagements.find(e => e.post_id === post.id);
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        return {
          ...post,
          user: {
            full_name: profile?.full_name || 'Unknown User',
            avatar_url: profile?.avatar_url || null,
          },
          engagement_score: engagement?.engagement_score || 0,
        };
      }).sort((a, b) => b.engagement_score - a.engagement_score) as TrendingPost[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!trendingPosts || trendingPosts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trendingPosts.map((post, index) => (
          <a
            key={post.id}
            href={`#post-${post.id}`}
            className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <Badge 
                variant={index === 0 ? 'default' : 'secondary'}
                className="h-8 w-8 rounded-full flex items-center justify-center"
              >
                {index + 1}
              </Badge>
            </div>

            {/* Thumbnail */}
            {post.thumbnail_url && (
              <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
                <img 
                  src={post.thumbnail_url} 
                  alt={post.title || 'Post thumbnail'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.user.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {post.user.full_name[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground">
                  {post.user.full_name}
                </p>
              </div>
              
              {post.title && (
                <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {post.title}
                </h4>
              )}
              
              <p className="text-xs text-muted-foreground line-clamp-1">
                {post.content}
              </p>

              {/* Engagement Stats */}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {post.like_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {post.comment_count}
                </span>
                {post.view_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.view_count.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Trending Badge */}
            {index === 0 && (
              <div className="flex-shrink-0">
                <Badge variant="destructive" className="text-xs">
                  🔥 Hot
                </Badge>
              </div>
            )}
          </a>
        ))}
      </CardContent>
    </Card>
  );
}

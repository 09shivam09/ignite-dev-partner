import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange?: (following: boolean) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function FollowButton({
  userId,
  isFollowing: initialFollowing,
  onFollowChange,
  variant = 'default',
  size = 'default',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleFollow = async () => {
    setIsLoading(true);
    const action = isFollowing ? 'unfollow' : 'follow';

    // Optimistic update
    setIsFollowing(!isFollowing);

    try {
      const { data, error } = await supabase.functions.invoke('follow-user', {
        body: { user_id: userId, action },
      });

      if (error) throw error;

      // Invalidate feed queries to refresh
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      
      toast.success(
        isFollowing 
          ? 'Unfollowed successfully' 
          : 'Now following'
      );

      onFollowChange?.(data.following);
    } catch (error) {
      // Revert optimistic update on error
      setIsFollowing(isFollowing);
      console.error('Follow error:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}

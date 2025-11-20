import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  postId: string;
  isBookmarked: boolean;
  onBookmarkChange?: (bookmarked: boolean) => void;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export function BookmarkButton({
  postId,
  isBookmarked: initialBookmarked,
  onBookmarkChange,
  variant = 'ghost',
  size = 'icon',
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleBookmark = async () => {
    setIsLoading(true);
    const action = isBookmarked ? 'unbookmark' : 'bookmark';

    // Optimistic update
    setIsBookmarked(!isBookmarked);

    try {
      const { data, error } = await supabase.functions.invoke('bookmark-post', {
        body: { post_id: postId, action },
      });

      if (error) throw error;

      toast.success(
        isBookmarked 
          ? 'Removed from bookmarks' 
          : 'Saved to bookmarks'
      );

      onBookmarkChange?.(data.bookmarked);
    } catch (error) {
      // Revert optimistic update on error
      setIsBookmarked(isBookmarked);
      console.error('Bookmark error:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBookmark}
      disabled={isLoading}
      className="transition-colors"
    >
      <Bookmark
        className={cn(
          'h-4 w-4',
          isBookmarked && 'fill-current'
        )}
      />
    </Button>
  );
}

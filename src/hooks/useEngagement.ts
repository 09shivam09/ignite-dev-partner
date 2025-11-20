import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to trigger engagement score calculation after user interactions
 */
export function useEngagementTracking(postId: string) {
  const trackEngagement = async (action: 'like' | 'comment' | 'share') => {
    try {
      // Trigger engagement calculator for this post
      await supabase.functions.invoke('engagement-calculator', {
        body: { post_id: postId },
      });
    } catch (error) {
      console.error('Error tracking engagement:', error);
    }
  };

  return { trackEngagement };
}

/**
 * Background job to calculate engagement scores
 * Can be called via cron or manually
 */
export async function runEngagementCalculator() {
  try {
    const { data, error } = await supabase.functions.invoke('engagement-calculator', {
      body: { batch_mode: true },
    });

    if (error) throw error;
    console.log('Engagement calculation completed:', data);
    return data;
  } catch (error) {
    console.error('Error running engagement calculator:', error);
    throw error;
  }
}

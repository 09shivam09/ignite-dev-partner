import { supabase } from '@/integrations/supabase/client';

// Placeholder media URLs (using reliable external sources)
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', // Party
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800', // Balloons
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', // Wedding
  'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800', // Celebration
  'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=800', // Event
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800', // DJ
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', // Conference
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', // Event hall
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800', // Food
  'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=800', // Decor
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800', // Party decor
  'https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800', // Cake
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800', // Flowers
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800', // Venue
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800', // Sunset wedding
];

const PLACEHOLDER_VIDEOS = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
];

const CAPTIONS_PHOTO = [
  '✨ Magic moments from last night\'s event!',
  'Can\'t believe how amazing this turned out 🎉',
  'Every detail matters when you\'re creating memories',
  'Behind the scenes of today\'s setup 📸',
  'Florals on point! 🌸',
  'This venue tho... 😍',
  'Sunset vibes at the reception 🌅',
  'Love is in the details 💕',
  'Another successful event in the books! 📖',
  'When the decor hits different ✨',
  'Creating magical experiences, one event at a time',
  'The cake was almost too pretty to eat 🎂',
  'That golden hour glow though ☀️',
  'Client said "make it unforgettable" - done ✅',
  'Event planning is my love language 💖',
];

const CAPTIONS_VIDEO = [
  '🎬 Highlights from yesterday\'s celebration!',
  'Watch the magic unfold ✨',
  'Event recap time! 🎉',
  'Behind the scenes vibes 🎥',
  'This is why we do what we do 💫',
  'The energy was unmatched! 🔥',
  'Full video coming soon!',
  'POV: You\'re at the best event ever',
  'The dance floor was LIT 🕺💃',
  'Moments that matter 🎬',
];

const CAPTIONS_REEL = [
  '🔥 Quick tip: How to choose the perfect venue',
  'Wait for it... 😱',
  'POV: The setup goes perfectly',
  'This hack saved our event! 💡',
  '3 things every event needs ✨',
  'Why didn\'t I think of this before?!',
  'Event planner things 📋',
  'The transformation though 😮',
  'Trend alert! 🚨',
  'Wedding season is HERE 💒',
];

export async function seedDummyContent(): Promise<{ success: boolean; message: string; counts: { photos: number; videos: number; reels: number } }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const counts = { photos: 0, videos: 0, reels: 0 };

  try {
    // Seed photo posts
    const photoPosts = PLACEHOLDER_IMAGES.map((url, index) => ({
      user_id: user.id,
      content: CAPTIONS_PHOTO[index % CAPTIONS_PHOTO.length],
      title: `Photo Post ${index + 1}`,
      media_type: 'photo' as const,
      media_urls: [url],
      thumbnail_url: url,
      moderation_status: 'approved',
      processing_status: 'ready',
      like_count: Math.floor(Math.random() * 500),
      comment_count: Math.floor(Math.random() * 50),
      view_count: Math.floor(Math.random() * 2000),
    }));

    const { data: insertedPhotos, error: photoError } = await supabase
      .from('posts')
      .insert(photoPosts)
      .select();

    if (photoError) throw photoError;
    counts.photos = insertedPhotos?.length || 0;

    // Seed video posts
    const videoPosts = PLACEHOLDER_VIDEOS.map((url, index) => ({
      user_id: user.id,
      content: CAPTIONS_VIDEO[index % CAPTIONS_VIDEO.length],
      title: `Video Post ${index + 1}`,
      media_type: 'video' as const,
      media_urls: [url],
      thumbnail_url: PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length],
      moderation_status: 'approved',
      processing_status: 'ready',
      like_count: Math.floor(Math.random() * 1000),
      comment_count: Math.floor(Math.random() * 100),
      view_count: Math.floor(Math.random() * 5000),
    }));

    const { data: insertedVideos, error: videoError } = await supabase
      .from('posts')
      .insert(videoPosts)
      .select();

    if (videoError) throw videoError;
    counts.videos = insertedVideos?.length || 0;

    // Seed reel posts
    const reelPosts = PLACEHOLDER_VIDEOS.map((url, index) => ({
      user_id: user.id,
      content: CAPTIONS_REEL[index % CAPTIONS_REEL.length],
      title: `Reel ${index + 1}`,
      media_type: 'reel' as const,
      media_urls: [url],
      thumbnail_url: PLACEHOLDER_IMAGES[(index + 5) % PLACEHOLDER_IMAGES.length],
      moderation_status: 'approved',
      processing_status: 'ready',
      like_count: Math.floor(Math.random() * 2000),
      comment_count: Math.floor(Math.random() * 200),
      view_count: Math.floor(Math.random() * 10000),
    }));

    const { data: insertedReels, error: reelError } = await supabase
      .from('posts')
      .insert(reelPosts)
      .select();

    if (reelError) throw reelError;
    counts.reels = insertedReels?.length || 0;

    return {
      success: true,
      message: `Seeded ${counts.photos} photos, ${counts.videos} videos, and ${counts.reels} reels`,
      counts,
    };
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
}

export async function clearSeededContent(): Promise<{ success: boolean; message: string; deleted: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    // Delete posts that use placeholder URLs
    const placeholderUrls = [...PLACEHOLDER_IMAGES, ...PLACEHOLDER_VIDEOS];
    
    // Get posts with placeholder media
    const { data: postsToDelete, error: fetchError } = await supabase
      .from('posts')
      .select('id, media_urls')
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;

    const idsToDelete = (postsToDelete || [])
      .filter(post => {
        const urls = post.media_urls || [];
        return urls.some((url: string) => 
          placeholderUrls.some(placeholder => url.includes(placeholder.split('?')[0]))
        );
      })
      .map(post => post.id);

    if (idsToDelete.length === 0) {
      return { success: true, message: 'No seeded content found', deleted: 0 };
    }

    // Delete related data first (likes, comments, bookmarks)
    await supabase.from('likes').delete().in('post_id', idsToDelete);
    await supabase.from('comments').delete().in('post_id', idsToDelete);
    await supabase.from('bookmarks').delete().in('post_id', idsToDelete);

    // Delete posts
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) throw deleteError;

    return {
      success: true,
      message: `Deleted ${idsToDelete.length} seeded posts`,
      deleted: idsToDelete.length,
    };
  } catch (error) {
    console.error('Clear error:', error);
    throw error;
  }
}

export async function getSeededPostCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return 0;

  const placeholderUrls = [...PLACEHOLDER_IMAGES, ...PLACEHOLDER_VIDEOS];

  const { data: posts } = await supabase
    .from('posts')
    .select('id, media_urls')
    .eq('user_id', user.id);

  return (posts || []).filter(post => {
    const urls = post.media_urls || [];
    return urls.some((url: string) => 
      placeholderUrls.some(placeholder => url.includes(placeholder.split('?')[0]))
    );
  }).length;
}

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      booking_id,
      vendor_id,
      rating,
      comment,
      images
    } = await req.json();

    console.log('Adding review for booking:', booking_id);

    // Validate booking belongs to user and is completed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('consumer_id', user.id)
      .eq('status', 'completed')
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found or not eligible for review');
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .single();

    if (existingReview) {
      throw new Error('Review already exists for this booking');
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        consumer_id: user.id,
        vendor_id: vendor_id || booking.vendor_id,
        booking_id,
        rating,
        comment,
        images: images || [],
        is_verified: true // Verified because it's from a completed booking
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review creation error:', reviewError);
      throw reviewError;
    }

    // Update vendor rating statistics
    const { data: vendorReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('vendor_id', vendor_id || booking.vendor_id)
      .eq('is_published', true);

    if (vendorReviews && vendorReviews.length > 0) {
      const totalRating = vendorReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / vendorReviews.length;

      await supabase
        .from('vendors')
        .update({
          rating: avgRating.toFixed(2),
          total_reviews: vendorReviews.length
        })
        .eq('id', vendor_id || booking.vendor_id);
    }

    // Create notification for vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('id', vendor_id || booking.vendor_id)
      .single();

    if (vendor) {
      await supabase
        .from('notifications')
        .insert({
          user_id: vendor.user_id,
          type: 'review',
          title: 'New Review Received',
          message: `You received a ${rating}-star review`,
          data: { review_id: review.id, rating }
        });
    }

    console.log('Review created successfully:', review.id);

    return new Response(
      JSON.stringify({ 
        review,
        message: 'Review submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Review submission error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorMessage === 'Unauthorized' ? 401 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
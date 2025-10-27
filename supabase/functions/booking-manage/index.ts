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

    const { booking_id, action, status, cancellation_reason } = await req.json();

    console.log('Managing booking:', { booking_id, action, user_id: user.id });

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, vendors(user_id)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Check authorization
    const isConsumer = booking.consumer_id === user.id;
    const isVendor = booking.vendors?.user_id === user.id;

    if (!isConsumer && !isVendor) {
      throw new Error('Unauthorized to manage this booking');
    }

    let updateData: any = {};
    let notificationData: any = {};

    switch (action) {
      case 'confirm':
        // Only vendors can confirm
        if (!isVendor) {
          throw new Error('Only vendors can confirm bookings');
        }
        updateData = { status: 'confirmed' };
        notificationData = {
          user_id: booking.consumer_id,
          type: 'booking',
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed by the vendor',
          data: { booking_id }
        };
        break;

      case 'cancel':
        if (booking.status === 'completed') {
          throw new Error('Cannot cancel completed bookings');
        }
        updateData = { 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellation_reason || 'User requested cancellation'
        };
        notificationData = {
          user_id: isConsumer ? booking.vendors.user_id : booking.consumer_id,
          type: 'booking',
          title: 'Booking Cancelled',
          message: `Booking has been cancelled. Reason: ${cancellation_reason || 'User requested cancellation'}`,
          data: { booking_id }
        };
        break;

      case 'update_status':
        // Vendors can update to in_progress or completed
        if (!isVendor) {
          throw new Error('Only vendors can update booking status');
        }
        if (!['in_progress', 'completed'].includes(status)) {
          throw new Error('Invalid status');
        }
        updateData = { status };
        notificationData = {
          user_id: booking.consumer_id,
          type: 'booking',
          title: 'Booking Status Updated',
          message: `Your booking status is now: ${status.replace('_', ' ')}`,
          data: { booking_id }
        };
        break;

      case 'reschedule':
        // Only consumers can reschedule
        if (!isConsumer) {
          throw new Error('Only consumers can reschedule bookings');
        }
        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
          throw new Error('Cannot reschedule bookings in this status');
        }
        const { event_date, event_time } = await req.json();
        updateData = { event_date, event_time };
        notificationData = {
          user_id: booking.vendors.user_id,
          type: 'booking',
          title: 'Booking Rescheduled',
          message: 'A customer has rescheduled their booking',
          data: { booking_id }
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) {
      console.error('Booking update error:', updateError);
      throw updateError;
    }

    // Send notification
    if (notificationData.user_id) {
      await supabase.from('notifications').insert(notificationData);
    }

    console.log('Booking updated successfully:', booking_id);

    return new Response(
      JSON.stringify({ 
        booking: updatedBooking,
        message: 'Booking updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Booking management error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: errorMessage.includes('Unauthorized') ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
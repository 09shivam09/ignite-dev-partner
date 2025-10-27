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

    const {
      booking_id,
      payment_method,
      payment_provider = 'stripe',
      card_details,
      billing_address
    } = await req.json();

    console.log('Processing payment for booking:', booking_id);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('consumer_id', user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    if (booking.payment_status === 'completed') {
      throw new Error('Booking already paid');
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id,
        user_id: user.id,
        amount: booking.total_amount,
        currency: 'USD',
        payment_method,
        payment_provider,
        status: 'processing',
        metadata: {
          billing_address,
          booking_reference: booking.booking_reference
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      throw paymentError;
    }

    try {
      // Simulate payment processing
      // In production, integrate with actual payment gateway (Stripe, Razorpay, etc.)
      const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Mock payment gateway call
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

      if (!paymentSuccess) {
        throw new Error('Payment declined by provider');
      }

      // Update payment record
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id
        })
        .eq('id', payment.id);

      if (paymentUpdateError) throw paymentUpdateError;

      // Update booking
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'completed',
          status: 'confirmed'
        })
        .eq('id', booking_id);

      if (bookingUpdateError) throw bookingUpdateError;

      // Update vendor total bookings
      const { error: vendorUpdateError } = await supabase
        .rpc('increment', {
          table_name: 'vendors',
          row_id: booking.vendor_id,
          column_name: 'total_bookings'
        });

      // Send notifications
      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          type: 'payment',
          title: 'Payment Successful',
          message: `Payment of $${booking.total_amount} processed successfully`,
          data: { booking_id, payment_id: payment.id }
        }
      ]);

      // Get vendor user_id for notification
      const { data: vendor } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', booking.vendor_id)
        .single();

      if (vendor) {
        await supabase.from('notifications').insert({
          user_id: vendor.user_id,
          type: 'payment',
          title: 'Payment Received',
          message: `Payment of $${booking.total_amount} received for booking ${booking.booking_reference}`,
          data: { booking_id, payment_id: payment.id }
        });
      }

      console.log('Payment processed successfully:', transaction_id);

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id,
          payment_id: payment.id,
          message: 'Payment processed successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (paymentError) {
      // Update payment to failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      const paymentErrorMessage = paymentError instanceof Error ? paymentError.message : 'Unknown payment error';
      throw new Error(`Payment processing failed: ${paymentErrorMessage}`);
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { status: errorMessage === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
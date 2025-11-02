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
      payment_provider = 'razorpay',
      card_details,
      billing_address,
      amount
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

    // Calculate token amount (20% of total)
    const tokenAmount = amount || (booking.total_amount * 0.20);
    const remainingAmount = booking.total_amount - tokenAmount;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id,
        user_id: user.id,
        amount: tokenAmount,
        currency: payment_provider === 'razorpay' ? 'INR' : 'USD',
        payment_method,
        payment_provider,
        status: 'processing',
        metadata: {
          billing_address,
          booking_reference: booking.booking_reference,
          token_payment: true,
          token_percentage: 20,
          remaining_amount: remainingAmount,
          full_amount: booking.total_amount
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      throw paymentError;
    }

    try {
      // Create order with payment provider
      let orderId;
      let transaction_id;

      if (payment_provider === 'razorpay') {
        // Razorpay order creation (simulation)
        orderId = `order_${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        transaction_id = `razorpay_${orderId}`;
        console.log('Created Razorpay order:', orderId, 'for amount:', tokenAmount);
      } else if (payment_provider === 'stripe') {
        // Stripe payment intent (simulation)
        orderId = `pi_${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        transaction_id = `stripe_${orderId}`;
        console.log('Created Stripe payment intent:', orderId, 'for amount:', tokenAmount);
      } else {
        orderId = `order_${Date.now()}`;
        transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Mock payment gateway call (90% success rate for demo)
      const paymentSuccess = Math.random() > 0.1;

      if (!paymentSuccess) {
        throw new Error('Payment declined by provider');
      }

      // Update payment record
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id,
          metadata: {
            ...payment.metadata,
            order_id: orderId,
            payment_gateway: payment_provider
          }
        })
        .eq('id', payment.id);

      if (paymentUpdateError) throw paymentUpdateError;

      // Update booking - token payment means partial payment
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'partial',
          status: 'confirmed',
          metadata: {
            token_paid: tokenAmount,
            remaining_balance: remainingAmount,
            payment_provider
          }
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
      const currency = payment_provider === 'razorpay' ? '₹' : '$';
      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          type: 'payment',
          title: 'Token Payment Successful',
          message: `Token payment of ${currency}${tokenAmount} (20%) processed. Remaining: ${currency}${remainingAmount}`,
          data: { booking_id, payment_id: payment.id, token_payment: true }
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
          title: 'Token Payment Received',
          message: `Token payment of ${currency}${tokenAmount} (20%) received for ${booking.booking_reference}. Balance: ${currency}${remainingAmount}`,
          data: { booking_id, payment_id: payment.id, token_payment: true }
        });
      }

      console.log('Payment processed successfully:', transaction_id);

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id,
          order_id: orderId,
          payment_id: payment.id,
          token_amount: tokenAmount,
          remaining_amount: remainingAmount,
          payment_provider,
          message: 'Token payment (20%) processed successfully'
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
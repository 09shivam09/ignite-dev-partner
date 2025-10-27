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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      vendor_id,
      service_id,
      event_date,
      event_time,
      event_type,
      guest_count,
      event_address,
      special_requirements,
      quantity = 1,
      coupon_code
    } = await req.json();

    console.log('Creating booking for user:', user.id);

    // Validate service exists and get price
    const { data: service, error: serviceError } = await supabase
      .from('vendor_services')
      .select('*, vendors(*)')
      .eq('id', service_id)
      .eq('vendor_id', vendor_id)
      .single();

    if (serviceError || !service) {
      throw new Error('Service not found');
    }

    if (!service.is_available) {
      throw new Error('Service is not available');
    }

    // Calculate pricing
    let base_price = service.base_price * quantity;
    let discount_amount = 0;
    let tax_amount = base_price * 0.1; // 10% tax

    // Apply coupon if provided
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code)
        .eq('is_active', true)
        .single();

      if (coupon && !couponError) {
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = new Date(coupon.valid_until);

        if (now >= validFrom && now <= validUntil) {
          if (!coupon.min_order_amount || base_price >= coupon.min_order_amount) {
            if (coupon.discount_type === 'percentage') {
              discount_amount = (base_price * coupon.discount_value) / 100;
              if (coupon.max_discount_amount) {
                discount_amount = Math.min(discount_amount, coupon.max_discount_amount);
              }
            } else {
              discount_amount = coupon.discount_value;
            }

            // Update coupon usage
            await supabase
              .from('coupons')
              .update({ usage_count: coupon.usage_count + 1 })
              .eq('id', coupon.id);
          }
        }
      }
    }

    const total_amount = base_price + tax_amount - discount_amount;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        consumer_id: user.id,
        vendor_id,
        service_id,
        event_date,
        event_time,
        event_type,
        guest_count,
        event_address,
        special_requirements,
        quantity,
        base_price,
        tax_amount,
        discount_amount,
        total_amount,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      throw bookingError;
    }

    // Create notification for vendor
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: service.vendors.user_id,
        type: 'booking',
        title: 'New Booking Request',
        message: `You have a new booking request for ${service.name}`,
        data: { booking_id: booking.id }
      });

    if (notifError) {
      console.error('Notification error:', notifError);
    }

    console.log('Booking created successfully:', booking.id);

    return new Response(
      JSON.stringify({ 
        booking,
        message: 'Booking created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Booking creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: errorMessage === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
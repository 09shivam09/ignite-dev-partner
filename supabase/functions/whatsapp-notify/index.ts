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
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886';

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials not configured');
    }

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
      to_number, 
      message_type = 'booking_confirmation',
      booking_id,
      custom_message 
    } = await req.json();

    console.log('WhatsApp notification request:', { to_number, message_type, booking_id });

    let messageBody = custom_message;

    // Generate message based on type if not custom
    if (!custom_message && booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, vendor_services(*), vendors(*)')
        .eq('id', booking_id)
        .single();

      if (booking) {
        switch (message_type) {
          case 'booking_confirmation':
            messageBody = `🎉 *Booking Confirmed!*

*Reference:* ${booking.booking_reference}
*Service:* ${booking.vendor_services.name}
*Vendor:* ${booking.vendors.business_name}
*Date:* ${new Date(booking.event_date).toLocaleDateString()}
*Time:* ${booking.event_time || 'TBD'}

Total: ₹${booking.total_amount.toLocaleString()}

View details in the EVENT-CONNECT app.
Thank you for choosing us! 🙏`;
            break;

          case 'booking_reminder':
            const eventDate = new Date(booking.event_date);
            const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            messageBody = `⏰ *Event Reminder*

Your event is coming up in *${daysUntil} days*!

*Service:* ${booking.vendor_services.name}
*Vendor:* ${booking.vendors.business_name}
*Date:* ${eventDate.toLocaleDateString()}

Please ensure all arrangements are confirmed.`;
            break;

          case 'booking_update':
            messageBody = `📢 *Booking Update*

*Reference:* ${booking.booking_reference}

Your booking status has been updated. Please check the app for details.`;
            break;

          default:
            messageBody = `*EVENT-CONNECT Notification*\n\n${custom_message || 'You have a new update regarding your booking.'}`;
        }
      }
    }

    if (!messageBody) {
      throw new Error('Message body is required');
    }

    // Format phone number for WhatsApp
    const formattedNumber = to_number.startsWith('whatsapp:') 
      ? to_number 
      : `whatsapp:${to_number}`;

    // Send WhatsApp message via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const formData = new URLSearchParams();
    formData.append('From', TWILIO_WHATSAPP_NUMBER);
    formData.append('To', formattedNumber);
    formData.append('Body', messageBody);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!twilioResponse.ok) {
      const error = await twilioResponse.text();
      console.error('Twilio API error:', error);
      throw new Error(`Twilio API error: ${error}`);
    }

    const result = await twilioResponse.json();
    console.log('WhatsApp message sent:', result.sid);

    return new Response(
      JSON.stringify({ 
        success: true,
        message_sid: result.sid,
        message: 'WhatsApp notification sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('WhatsApp notification error:', error);
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
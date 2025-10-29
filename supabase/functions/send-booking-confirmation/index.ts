import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend_api_key = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  booking_id: string;
  user_email: string;
  user_name: string;
  vendor_name: string;
  service_name: string;
  event_date: string;
  event_time: string;
  total_amount: number;
  booking_reference: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
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
      user_email,
      user_name,
      vendor_name,
      service_name,
      event_date,
      event_time,
      total_amount,
      booking_reference,
    }: BookingConfirmationRequest = await req.json();

    console.log("Sending booking confirmation email to:", user_email);

    if (!resend_api_key) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Send confirmation email to customer using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resend_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "EVENT-CONNECT <onboarding@resend.dev>",
        to: [user_email],
        subject: `Booking Confirmed - ${booking_reference}`,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #2D1B69 0%, #00D4FF 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-label { font-weight: bold; color: #2D1B69; }
              .total { font-size: 1.3em; font-weight: bold; color: #00D4FF; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
              .button { display: inline-block; padding: 12px 30px; background: #00D4FF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Booking Confirmed!</h1>
                <p>Reference: ${booking_reference}</p>
              </div>
              <div class="content">
                <h2>Hi ${user_name},</h2>
                <p>Great news! Your booking has been confirmed. Here are your booking details:</p>
                
                <div class="booking-details">
                  <div class="detail-row">
                    <span class="detail-label">Service:</span>
                    <span>${service_name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Vendor:</span>
                    <span>${vendor_name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Event Date:</span>
                    <span>${new Date(event_date).toLocaleDateString()}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Event Time:</span>
                    <span>${event_time}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Total Amount:</span>
                    <span class="total">₹${total_amount.toLocaleString()}</span>
                  </div>
                </div>

                <p>The vendor will contact you soon to confirm the details. You can view and manage your booking anytime in the app.</p>
                
                <center>
                  <a href="${Deno.env.get('FRONTEND_URL') || 'https://event-connect.lovable.app'}/booking-details/${booking_id}" class="button">
                    View Booking Details
                  </a>
                </center>

                <p><strong>Need help?</strong> Contact our support team or chat with us directly in the app.</p>
              </div>
              <div class="footer">
                <p>Thank you for choosing EVENT-CONNECT!</p>
                <p>Making your events memorable, one booking at a time.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error('Resend API error:', error);
      throw new Error(`Email sending failed: ${error}`);
    }

    const emailData = await emailResponse.json();
    console.log("Customer confirmation email sent:", emailData);

    // Also send notification to vendor
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, vendors(*)')
      .eq('id', booking_id)
      .single();

    if (booking && booking.vendors) {
      await supabase
        .from('notifications')
        .insert({
          user_id: booking.vendors.user_id,
          type: 'booking',
          title: 'New Booking Received',
          message: `New booking for ${service_name} on ${new Date(event_date).toLocaleDateString()}`,
          data: { booking_id, booking_reference }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Confirmation email sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-booking-confirmation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
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

    const { booking_id, action = 'create' } = await req.json();

    console.log('Google Calendar sync request:', { booking_id, action });

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, vendor_services(*), vendors(*)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Generate calendar event details
    const eventDateTime = new Date(`${booking.event_date}T${booking.event_time || '10:00'}`);
    const endDateTime = new Date(eventDateTime.getTime() + (4 * 60 * 60 * 1000)); // 4 hours duration

    const calendarEvent = {
      summary: `${booking.vendor_services.name} - ${booking.vendors.business_name}`,
      description: `
Event Type: ${booking.event_type}
Service: ${booking.vendor_services.name}
Vendor: ${booking.vendors.business_name}
Guest Count: ${booking.guest_count || 'Not specified'}
${booking.special_requirements ? `Special Requirements: ${booking.special_requirements}` : ''}

Booking Reference: ${booking.booking_reference}
Total Amount: ₹${booking.total_amount}

Contact: ${booking.vendors.business_phone || 'Available in app'}
      `.trim(),
      location: booking.event_address || booking.vendors.business_address || 'Location TBD',
      start: {
        dateTime: eventDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
      colorId: '9', // Blue color for events
    };

    // Return calendar event data for client-side Google Calendar API integration
    return new Response(
      JSON.stringify({ 
        calendar_event: calendarEvent,
        message: 'Calendar event data prepared. Use Google Calendar API on client side to add this event.',
        instructions: {
          step1: 'Get Google Calendar API credentials from Google Cloud Console',
          step2: 'Use the calendar_event data with Google Calendar API',
          step3: 'Call calendar.events.insert() with this event data',
          icalLink: `data:text/calendar;charset=utf8,${encodeURIComponent(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${eventDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${calendarEvent.summary}
DESCRIPTION:${calendarEvent.description.replace(/\n/g, '\\n')}
LOCATION:${calendarEvent.location}
END:VEVENT
END:VCALENDAR`)}`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Calendar sync error:', error);
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
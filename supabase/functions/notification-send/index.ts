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
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      user_ids,
      type,
      title,
      message,
      data,
      send_push = true,
      send_email = false
    } = await req.json();

    console.log('Sending notifications to:', user_ids?.length || 0, 'users');

    // Create in-app notifications
    const notifications = user_ids.map((user_id: string) => ({
      user_id,
      type,
      title,
      message,
      data
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Notification creation error:', notifError);
      throw notifError;
    }

    // TODO: Implement push notification service (FCM, OneSignal, etc.)
    if (send_push) {
      console.log('Push notifications would be sent here');
      // Integration with Firebase Cloud Messaging or similar service
    }

    // TODO: Implement email service (SendGrid, AWS SES, etc.)
    if (send_email) {
      console.log('Email notifications would be sent here');
      // Get user emails and send via email service
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email')
        .in('user_id', user_ids);

      // Send emails to profiles
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent successfully',
        count: user_ids.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notification sending error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
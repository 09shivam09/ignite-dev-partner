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
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    });

    const {
      event_name,
      event_properties,
      user_properties
    } = await req.json();

    // Try to get user if authenticated
    let user_id = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser();
      user_id = user?.id || null;
    }

    console.log('Tracking event:', event_name, 'for user:', user_id);

    // Store analytics event
    // In production, this would integrate with analytics platforms
    // like Mixpanel, Amplitude, Google Analytics, etc.

    const analyticsData = {
      timestamp: new Date().toISOString(),
      user_id,
      event_name,
      event_properties,
      user_properties,
      session_id: req.headers.get('x-session-id'),
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    };

    // Log to console (in production, send to analytics service)
    console.log('Analytics event:', JSON.stringify(analyticsData, null, 2));

    // Store in database for internal analytics
    // You would create an analytics_events table if needed
    // await supabase.from('analytics_events').insert(analyticsData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event tracked successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Analytics tracking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
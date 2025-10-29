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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { event_type, guest_count, location, budget } = await req.json();

    console.log('Generating recommendations for user:', user.id);

    // Get user's booking history
    const { data: bookingHistory } = await supabase
      .from('bookings')
      .select('*, vendor_services(*), vendors(*)')
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get user profile preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences, city')
      .eq('user_id', user.id)
      .single();

    // Get popular services in the area
    const { data: popularServices } = await supabase
      .from('vendor_services')
      .select('*, vendors(*)')
      .eq('is_available', true)
      .order('base_price', { ascending: true })
      .limit(20);

    // Build context for AI
    const context = {
      user_preferences: profile?.preferences || {},
      user_city: profile?.city || location,
      booking_history: bookingHistory?.map(b => ({
        service: b.vendor_services?.name,
        vendor: b.vendors?.business_name,
        event_type: b.event_type,
        rating: b.vendors?.rating
      })) || [],
      event_details: {
        type: event_type,
        guest_count,
        budget,
        location
      }
    };

    // Call Lovable AI for intelligent recommendations
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert event planning assistant. Analyze user preferences, booking history, and event requirements to provide personalized service recommendations. Return recommendations as a JSON array with format: [{"service_type": "string", "reason": "string", "priority": "high/medium/low", "estimated_budget": number}]`
          },
          {
            role: 'user',
            content: `Generate personalized event service recommendations based on this context: ${JSON.stringify(context, null, 2)}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI service requires payment. Please add credits to your workspace.');
      }
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const aiRecommendations = aiData.choices[0].message.content;

    // Parse AI recommendations
    let recommendations;
    try {
      recommendations = JSON.parse(aiRecommendations);
    } catch {
      // If AI doesn't return valid JSON, create fallback recommendations
      recommendations = [
        {
          service_type: 'Catering',
          reason: 'Essential for events with guests',
          priority: 'high',
          estimated_budget: budget ? budget * 0.4 : 0
        },
        {
          service_type: 'Decoration',
          reason: 'Creates memorable ambiance',
          priority: 'medium',
          estimated_budget: budget ? budget * 0.3 : 0
        }
      ];
    }

    // Match recommendations with actual available services
    const matchedServices = [];
    for (const rec of recommendations) {
      const services = popularServices?.filter(s => 
        s.name.toLowerCase().includes(rec.service_type.toLowerCase()) ||
        s.description?.toLowerCase().includes(rec.service_type.toLowerCase())
      ).slice(0, 3);

      if (services && services.length > 0) {
        matchedServices.push({
          ...rec,
          available_services: services
        });
      }
    }

    console.log('Generated recommendations:', matchedServices.length);

    return new Response(
      JSON.stringify({ 
        recommendations: matchedServices,
        message: 'Recommendations generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Recommendations error:', error);
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
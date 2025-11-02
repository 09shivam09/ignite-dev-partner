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

    const { event_type, guest_count, location, budget, style_reference_image, preferences } = await req.json();

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

    // Build AI prompt messages with optional image
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert event planner. Analyze event requirements and provide comprehensive planning recommendations. Return response as JSON with this exact format:
{
  "vendor_recommendations": [{"service_type": "string", "reason": "string", "priority": "high/medium/low", "estimated_budget": number}],
  "theme_inspiration": {"style": "string", "colors": ["color1", "color2"], "decor_ideas": ["idea1", "idea2"], "mood": "string"},
  "budget_breakdown": {"venue": number, "catering": number, "decoration": number, "photography": number, "entertainment": number, "other": number},
  "timeline_plan": [{"task": "string", "weeks_before": number, "priority": "high/medium/low"}]
}`
      }
    ];

    // Add user message with optional image
    if (style_reference_image) {
      messages.push({
        role: 'user',
        content: [
          {
            type: "text",
            text: `Plan this event: ${event_type} in ${location}. Budget: ₹${budget}. Guests: ${guest_count}. ${preferences || ''}\n\nContext: ${JSON.stringify(context, null, 2)}`
          },
          {
            type: "image_url",
            image_url: { url: style_reference_image }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Plan this event: ${event_type} in ${location}. Budget: ₹${budget}. Guests: ${guest_count}. ${preferences || ''}\n\nContext: ${JSON.stringify(context, null, 2)}`
      });
    }

    // Call Lovable AI for intelligent recommendations
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
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
    let planData;
    try {
      planData = JSON.parse(aiRecommendations);
    } catch {
      // Fallback structure
      planData = {
        vendor_recommendations: [
          { service_type: 'Venue', reason: 'Essential for event', priority: 'high', estimated_budget: budget ? budget * 0.3 : 0 },
          { service_type: 'Catering', reason: 'Food for guests', priority: 'high', estimated_budget: budget ? budget * 0.4 : 0 },
          { service_type: 'Decoration', reason: 'Creates ambiance', priority: 'medium', estimated_budget: budget ? budget * 0.2 : 0 }
        ],
        theme_inspiration: {
          style: 'Modern Elegant',
          colors: ['#FFD700', '#FFFFFF', '#F5F5DC'],
          decor_ideas: ['Floral centerpieces', 'Ambient lighting'],
          mood: 'Warm and inviting'
        },
        budget_breakdown: {
          venue: budget ? budget * 0.3 : 0,
          catering: budget ? budget * 0.4 : 0,
          decoration: budget ? budget * 0.15 : 0,
          photography: budget ? budget * 0.1 : 0,
          entertainment: budget ? budget * 0.05 : 0
        },
        timeline_plan: [
          { task: 'Book venue', weeks_before: 12, priority: 'high' },
          { task: 'Finalize catering', weeks_before: 8, priority: 'high' },
          { task: 'Order decorations', weeks_before: 4, priority: 'medium' }
        ]
      };
    }

    // Match recommendations with actual available services
    const matchedServices = [];
    for (const rec of planData.vendor_recommendations) {
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

    console.log('Generated event plan with', matchedServices.length, 'vendor recommendations');

    return new Response(
      JSON.stringify({ 
        vendor_recommendations: matchedServices,
        theme_inspiration: planData.theme_inspiration,
        budget_breakdown: planData.budget_breakdown,
        timeline_plan: planData.timeline_plan,
        message: 'Event plan generated successfully'
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
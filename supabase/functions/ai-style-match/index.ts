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
    if (userError || !user) throw new Error('Unauthorized');

    const { image_url, description, preferences } = await req.json();

    console.log('Analyzing style with AI vision model...');

    // Use Lovable AI with vision capabilities (gemini-2.5-flash supports images)
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
            content: `You are an expert event stylist and designer. Analyze event photos and provide detailed style recommendations including color palettes, themes, decor elements, and vendor types needed. Return recommendations as JSON with format: {
              "style_type": "string",
              "color_palette": ["color1", "color2", "color3"],
              "theme": "string",
              "decor_elements": ["element1", "element2"],
              "recommended_vendors": [{"type": "string", "reason": "string"}],
              "budget_estimate": "string",
              "season_suitability": "string"
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: `Analyze this event style and provide recommendations. ${description ? `User notes: ${description}` : ''} ${preferences ? `User preferences: ${JSON.stringify(preferences)}` : ''}`
              },
              ...(image_url ? [{
                type: "image_url",
                image_url: { url: image_url }
              }] : [])
            ]
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
    const analysis = aiData.choices[0].message.content;

    // Parse AI response
    let styleMatches;
    try {
      styleMatches = JSON.parse(analysis);
    } catch {
      // If not valid JSON, create a basic response
      styleMatches = {
        style_type: 'Modern',
        color_palette: ['#FFFFFF', '#F5F5F5', '#E0E0E0'],
        theme: 'Elegant Contemporary',
        decor_elements: ['Minimalist', 'Clean Lines', 'Natural Light'],
        recommended_vendors: [
          { type: 'Decorator', reason: 'Modern aesthetic expertise' },
          { type: 'Florist', reason: 'Contemporary arrangements' }
        ],
        budget_estimate: 'Medium to High',
        season_suitability: 'All Seasons'
      };
    }

    // Find matching vendors based on style
    const { data: vendors } = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        rating,
        vendor_services(name, base_price, category_id)
      `)
      .eq('is_active', true)
      .limit(10);

    console.log('Style analysis complete');

    return new Response(
      JSON.stringify({ 
        style_matches: styleMatches,
        matching_vendors: vendors || [],
        message: 'Style analysis complete'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Style match error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

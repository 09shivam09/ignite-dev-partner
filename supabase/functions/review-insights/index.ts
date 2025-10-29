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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { vendor_id } = await req.json();

    if (!vendor_id) {
      throw new Error('vendor_id is required');
    }

    console.log('Generating review insights for vendor:', vendor_id);

    // Fetch all reviews for the vendor
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, comment, created_at')
      .eq('vendor_id', vendor_id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (reviewsError) {
      throw reviewsError;
    }

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ 
          insights: {
            summary: 'No reviews yet',
            sentiment: 'neutral',
            strengths: [],
            areas_for_improvement: [],
            rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate rating breakdown
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      ratingBreakdown[review.rating as keyof typeof ratingBreakdown]++;
    });

    // Prepare reviews for AI analysis
    const reviewsContext = reviews.map(r => ({
      rating: r.rating,
      comment: r.comment || '',
      date: r.created_at
    }));

    // Call Lovable AI for intelligent review analysis
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
            content: `You are an expert at analyzing customer reviews and extracting insights. Analyze the reviews and provide a JSON response with: {
              "summary": "2-3 sentence summary of overall sentiment",
              "sentiment": "positive/neutral/negative",
              "strengths": ["list", "of", "key", "strengths"],
              "areas_for_improvement": ["list", "of", "improvement", "areas"],
              "popular_phrases": ["commonly", "mentioned", "phrases"],
              "percentage_satisfied": number (0-100)
            }`
          },
          {
            role: 'user',
            content: `Analyze these ${reviews.length} reviews and provide insights: ${JSON.stringify(reviewsContext, null, 2)}`
          }
        ],
        temperature: 0.5,
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
    const aiInsights = aiData.choices[0].message.content;

    // Parse AI insights
    let insights;
    try {
      insights = JSON.parse(aiInsights);
      insights.rating_breakdown = ratingBreakdown;
      insights.total_reviews = reviews.length;
    } catch {
      // Fallback if AI doesn't return valid JSON
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      insights = {
        summary: `Based on ${reviews.length} reviews with an average rating of ${avgRating.toFixed(1)} stars`,
        sentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative',
        strengths: ['Quality service', 'Professional team'],
        areas_for_improvement: ['Response time'],
        rating_breakdown: ratingBreakdown,
        total_reviews: reviews.length,
        percentage_satisfied: Math.round((avgRating / 5) * 100)
      };
    }

    console.log('Generated review insights for vendor:', vendor_id);

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Review insights error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
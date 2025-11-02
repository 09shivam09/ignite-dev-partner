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
      global: authHeader ? { headers: { Authorization: authHeader } } : {}
    });

    if (req.method === 'GET') {
      // Get inspiration gallery items from vendor portfolios
      const url = new URL(req.url);
      const category = url.searchParams.get('category');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let query = supabase
        .from('vendor_portfolio')
        .select(`
          *,
          vendors!inner(
            id,
            business_name,
            rating,
            vendor_services!inner(
              name,
              base_price,
              category_id,
              categories(name)
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('vendors.vendor_services.categories.name', category);
      }

      const { data: portfolio, error } = await query;

      if (error) throw error;

      // Transform to inspiration format
      const inspiration = portfolio.map(item => ({
        id: item.id,
        image_url: item.image_url,
        caption: item.caption,
        vendor_name: item.vendors.business_name,
        vendor_id: item.vendors.id,
        rating: item.vendors.rating,
        service: item.vendors.vendor_services[0]?.name,
        category: item.vendors.vendor_services[0]?.categories?.name,
        price: item.vendors.vendor_services[0]?.base_price
      }));

      return new Response(
        JSON.stringify({ inspiration }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Save to moodboard (user's saved items)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Unauthorized');

      const { portfolio_ids } = await req.json();

      // Store in user preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      const currentPrefs = profile?.preferences || {};
      const moodboard = currentPrefs.moodboard || [];

      // Merge new items
      const updatedMoodboard = [...new Set([...moodboard, ...portfolio_ids])];

      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...currentPrefs,
            moodboard: updatedMoodboard
          }
        })
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          message: 'Moodboard saved successfully',
          moodboard: updatedMoodboard
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Inspiration error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

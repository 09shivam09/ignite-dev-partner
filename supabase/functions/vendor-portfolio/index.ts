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

    const url = new URL(req.url);
    const vendorId = url.pathname.split('/').pop();

    if (req.method === 'GET') {
      // Get vendor portfolio
      const { data: portfolio, error } = await supabase
        .from('vendor_portfolio')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ portfolio }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Upload portfolio image
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Unauthorized');

      const { image_url, caption, display_order } = await req.json();

      // Verify vendor ownership
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', vendorId)
        .single();

      if (!vendor) throw new Error('Vendor not found or unauthorized');

      const { data, error } = await supabase
        .from('vendor_portfolio')
        .insert({
          vendor_id: vendorId,
          image_url,
          caption,
          display_order: display_order || 0
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ portfolio: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Portfolio error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

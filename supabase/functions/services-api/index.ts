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
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // GET /services - List all services
    if (req.method === 'GET' && pathParts.length === 2) {
      const category = url.searchParams.get('category');
      const vendorId = url.searchParams.get('vendor_id');
      const minPrice = url.searchParams.get('min_price');
      const maxPrice = url.searchParams.get('max_price');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let query = supabase
        .from('vendor_services')
        .select('*, vendors(*), categories(*)', { count: 'exact' })
        .eq('is_available', true);

      if (category) {
        query = query.eq('category_id', category);
      }

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      if (minPrice) {
        query = query.gte('base_price', parseFloat(minPrice));
      }

      if (maxPrice) {
        query = query.lte('base_price', parseFloat(maxPrice));
      }

      const { data: services, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          services,
          total: count,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /services/:id - Get service by ID
    if (req.method === 'GET' && pathParts.length === 3) {
      const serviceId = pathParts[2];

      const { data: service, error } = await supabase
        .from('vendor_services')
        .select('*, vendors(*), categories(*)')
        .eq('id', serviceId)
        .single();

      if (error) throw error;

      // Get reviews for this service
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*, profiles(*)')
        .eq('vendor_id', service.vendor_id)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({ 
          service: {
            ...service,
            reviews: reviews || []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /services/category/:category - Get services by category
    if (req.method === 'GET' && pathParts[2] === 'category' && pathParts.length === 4) {
      const categorySlug = pathParts[3];
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      // First get category
      const { data: category, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .single();

      if (catError) throw catError;

      const { data: services, error, count } = await supabase
        .from('vendor_services')
        .select('*, vendors(*), categories(*)', { count: 'exact' })
        .eq('category_id', category.id)
        .eq('is_available', true)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          services,
          total: count,
          page,
          limit,
          total_pages: Math.ceil((count || 0) / limit)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Services API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
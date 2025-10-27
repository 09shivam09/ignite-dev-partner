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

    const { 
      query, 
      category, 
      latitude, 
      longitude, 
      radius = 50, 
      minRating, 
      maxPrice,
      sortBy = 'rating',
      page = 1,
      limit = 20 
    } = await req.json();

    console.log('Vendor search request:', { query, category, latitude, longitude, radius });

    // Build query
    let dbQuery = supabase
      .from('vendors')
      .select(`
        *,
        vendor_services (
          id,
          name,
          description,
          base_price,
          category_id,
          categories (name, slug)
        )
      `)
      .eq('is_active', true)
      .eq('verification_status', 'verified');

    // Text search on business name and description
    if (query) {
      dbQuery = dbQuery.or(`business_name.ilike.%${query}%,business_description.ilike.%${query}%`);
    }

    // Filter by rating
    if (minRating) {
      dbQuery = dbQuery.gte('rating', minRating);
    }

    // Get vendors
    const { data: vendors, error: vendorError } = await dbQuery;

    if (vendorError) {
      console.error('Vendor query error:', vendorError);
      throw vendorError;
    }

    // Filter by category if specified
    let filteredVendors = vendors;
    if (category) {
      filteredVendors = vendors?.filter(vendor => 
        vendor.vendor_services?.some((service: any) => 
          service.categories?.slug === category
        )
      ) || [];
    }

    // Filter by max price if specified
    if (maxPrice) {
      filteredVendors = filteredVendors?.filter(vendor =>
        vendor.vendor_services?.some((service: any) => 
          service.base_price <= maxPrice
        )
      ) || [];
    }

    // Calculate distance if location provided
    if (latitude && longitude) {
      filteredVendors = filteredVendors?.map(vendor => {
        if (vendor.location) {
          // Parse PostGIS point format
          const coords = vendor.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
          if (coords) {
            const vendorLng = parseFloat(coords[1]);
            const vendorLat = parseFloat(coords[2]);
            
            // Haversine formula for distance
            const R = 6371; // Earth radius in km
            const dLat = (vendorLat - latitude) * Math.PI / 180;
            const dLon = (vendorLng - longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(latitude * Math.PI / 180) * Math.cos(vendorLat * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            return { ...vendor, distance };
          }
        }
        return { ...vendor, distance: null };
      }) || [];

      // Filter by radius
      filteredVendors = filteredVendors.filter(v => 
        v.distance === null || v.distance <= radius
      );
    }

    // Sort results
    if (sortBy === 'rating') {
      filteredVendors?.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'distance' && latitude && longitude) {
      filteredVendors?.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else if (sortBy === 'price') {
      filteredVendors?.sort((a, b) => {
        const aPrice = Math.min(...(a.vendor_services?.map((s: any) => s.base_price) || [Infinity]));
        const bPrice = Math.min(...(b.vendor_services?.map((s: any) => s.base_price) || [Infinity]));
        return aPrice - bPrice;
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVendors = filteredVendors?.slice(startIndex, endIndex);

    return new Response(
      JSON.stringify({
        vendors: paginatedVendors,
        total: filteredVendors?.length || 0,
        page,
        limit,
        totalPages: Math.ceil((filteredVendors?.length || 0) / limit)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vendor search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    if (req.method === 'POST' && pathParts.includes('create')) {
      // Create a new lead (booking inquiry)
      const { vendor_id, service_id, event_date, event_type, guest_count, message } = await req.json();

      const { data: lead, error } = await supabase
        .from('bookings')
        .insert({
          consumer_id: user.id,
          vendor_id,
          service_id,
          event_date,
          event_type,
          guest_count,
          special_requirements: message,
          status: 'pending',
          payment_status: 'pending',
          base_price: 0, // Will be updated by vendor
          total_amount: 0
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Lead created:', lead.id);

      return new Response(
        JSON.stringify({ lead, message: 'Lead created successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET' && pathParts.includes('vendor')) {
      // Get leads for a vendor
      const vendorId = pathParts[pathParts.length - 1];

      // Verify vendor ownership
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', vendorId)
        .single();

      if (!vendor) throw new Error('Vendor not found or unauthorized');

      const { data: leads, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_consumer_id_fkey(full_name, email, phone),
          vendor_services(name, base_price)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ leads }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PATCH') {
      // Update lead status
      const leadId = pathParts[pathParts.length - 1];
      const { status, notes } = await req.json();

      // Verify the user owns this lead (either as vendor or consumer)
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, vendors!inner(user_id)')
        .eq('id', leadId)
        .single();

      if (!booking) throw new Error('Lead not found');

      const isVendor = booking.vendors.user_id === user.id;
      const isConsumer = booking.consumer_id === user.id;

      if (!isVendor && !isConsumer) throw new Error('Unauthorized');

      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status,
          special_requirements: notes || booking.special_requirements
        })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ lead: data, message: 'Lead updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Leads error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

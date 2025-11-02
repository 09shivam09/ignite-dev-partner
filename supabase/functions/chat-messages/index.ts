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

    if (req.method === 'POST' && pathParts.includes('createRoom')) {
      // Create a chat room between user and vendor
      const { vendor_id } = await req.json();

      // Get vendor's user_id
      const { data: vendor } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', vendor_id)
        .single();

      if (!vendor) throw new Error('Vendor not found');

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('messages')
        .select('conversation_id')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${vendor.user_id}),and(sender_id.eq.${vendor.user_id},receiver_id.eq.${user.id})`)
        .limit(1)
        .single();

      const conversationId = existing?.conversation_id || crypto.randomUUID();

      return new Response(
        JSON.stringify({ conversation_id: conversationId, receiver_id: vendor.user_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && pathParts.includes('sendMessage')) {
      // Send a message
      const { receiver_id, content, conversation_id, attachments } = await req.json();

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id,
          sender_id: user.id,
          receiver_id,
          content,
          attachments: attachments || []
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Message sent:', message.id);

      return new Response(
        JSON.stringify({ message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get messages for a conversation
      const conversationId = pathParts[pathParts.length - 2];

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      return new Response(
        JSON.stringify({ messages }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

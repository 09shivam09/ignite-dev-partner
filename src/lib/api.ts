import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_SUPABASE_URL;

// Helper to get auth headers
const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
  };
};

// Auth Endpoints
export const authAPI = {
  login: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  register: async (email: string, password: string, metadata?: any) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: metadata }
    });
  },
  logout: async () => {
    return await supabase.auth.signOut();
  }
};

// Vendor Endpoints
export const vendorAPI = {
  search: async (params: {
    city?: string;
    category?: string;
    budget?: number;
    rating?: number;
    page?: number;
    limit?: number;
  }) => {
    const { data, error } = await supabase.functions.invoke('vendor-search', {
      body: params
    });
    if (error) throw error;
    return data;
  },
  
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        *,
        vendor_services(
          id,
          name,
          description,
          base_price,
          pricing_type,
          images,
          is_available,
          category_id,
          categories(name, slug)
        ),
        vendor_portfolio(
          id,
          image_url,
          caption,
          display_order
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  getPortfolio: async (vendorId: string) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/vendor-portfolio/${vendorId}`,
      { headers: await getHeaders() }
    );
    return await response.json();
  },
  
  getReviews: async (vendorId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles!reviews_consumer_id_fkey(full_name, avatar_url)
      `)
      .eq('vendor_id', vendorId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  create: async (vendorData: any) => {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendorData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  uploadPortfolio: async (vendorId: string, imageData: any) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/vendor-portfolio/${vendorId}`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(imageData)
      }
    );
    return await response.json();
  },
  
  updatePackages: async (vendorId: string, packages: any[]) => {
    // Update vendor services
    const promises = packages.map(pkg => 
      supabase
        .from('vendor_services')
        .upsert({
          vendor_id: vendorId,
          ...pkg
        })
    );
    
    const results = await Promise.all(promises);
    return results;
  }
};

// Lead Endpoints
export const leadAPI = {
  create: async (leadData: any) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/leads-manage/create`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(leadData)
      }
    );
    return await response.json();
  },
  
  getVendorLeads: async (vendorId: string) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/leads-manage/vendor/${vendorId}`,
      { headers: await getHeaders() }
    );
    return await response.json();
  },
  
  updateStatus: async (leadId: string, status: string, notes?: string) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/leads-manage/${leadId}`,
      {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ status, notes })
      }
    );
    return await response.json();
  }
};

// Chat Endpoints
export const chatAPI = {
  createRoom: async (vendorId: string) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/chat-messages/createRoom`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ vendor_id: vendorId })
      }
    );
    return await response.json();
  },
  
  sendMessage: async (messageData: any) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/chat-messages/sendMessage`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(messageData)
      }
    );
    return await response.json();
  },
  
  getMessages: async (roomId: string) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/chat-messages/${roomId}/messages`,
      { headers: await getHeaders() }
    );
    return await response.json();
  }
};

// Booking & Payment Endpoints
export const bookingAPI = {
  create: async (bookingData: any) => {
    const { data, error } = await supabase.functions.invoke('booking-create', {
      body: bookingData
    });
    if (error) throw error;
    return data;
  },
  
  initiatePayment: async (bookingId: string, amount: number) => {
    const { data, error } = await supabase.functions.invoke('payment-process', {
      body: { booking_id: bookingId, amount }
    });
    if (error) throw error;
    return data;
  },
  
  verifyPayment: async (paymentId: string, signature: string) => {
    const { data, error } = await supabase.functions.invoke('payment-process', {
      body: { 
        payment_id: paymentId, 
        signature,
        action: 'verify'
      }
    });
    if (error) throw error;
    return data;
  }
};

// Inspiration Endpoints
export const inspirationAPI = {
  getGallery: async (category?: string, limit?: number) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/inspiration-gallery?${new URLSearchParams({
        ...(category && { category }),
        ...(limit && { limit: limit.toString() })
      })}`
    );
    return await response.json();
  },
  
  saveMoodboard: async (portfolioIds: string[]) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/inspiration-gallery`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ portfolio_ids: portfolioIds })
      }
    );
    return await response.json();
  }
};

// AI Endpoints
export const aiAPI = {
  planEvent: async (eventData: any) => {
    const { data, error } = await supabase.functions.invoke('ai-recommendations', {
      body: eventData
    });
    if (error) throw error;
    return data;
  },
  
  matchStyle: async (imageUrl?: string, description?: string, preferences?: any) => {
    const response = await fetch(
      `${API_BASE}/functions/v1/ai-style-match`,
      {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ 
          image_url: imageUrl,
          description,
          preferences
        })
      }
    );
    return await response.json();
  }
};

// Export all APIs
export const api = {
  auth: authAPI,
  vendor: vendorAPI,
  lead: leadAPI,
  chat: chatAPI,
  booking: bookingAPI,
  inspiration: inspirationAPI,
  ai: aiAPI
};

export default api;

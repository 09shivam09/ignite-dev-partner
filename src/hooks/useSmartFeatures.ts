import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// AI Event Planner
export const useAIRecommendations = (params: {
  event_type?: string;
  guest_count?: number;
  location?: string;
  budget?: number;
  style_reference_image?: string;
  preferences?: string;
}) => {
  return useQuery({
    queryKey: ["ai-recommendations", params],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-recommendations", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(params.event_type || params.location),
  });
};

// AI Style Matching
export const useStyleMatch = () => {
  return useMutation({
    mutationFn: async (params: {
      image_url?: string;
      description?: string;
      preferences?: any;
    }) => {
      const { data, error } = await supabase.functions.invoke("ai-style-match", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
  });
};

// Review Insights
export const useReviewInsights = (vendorId: string) => {
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorId);
  
  return useQuery({
    queryKey: ["review-insights", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("review-insights", {
        body: { vendor_id: vendorId },
      });
      if (error) throw error;
      return data.insights;
    },
    enabled: !!vendorId && isValidUUID,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

// Enhanced AI Chatbot
export const useChatbot = () => {
  return useMutation({
    mutationFn: async (params: { 
      message: string; 
      conversation_history?: Array<{ role: string; content: string }> 
    }) => {
      const { data, error } = await supabase.functions.invoke("ai-support", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
  });
};
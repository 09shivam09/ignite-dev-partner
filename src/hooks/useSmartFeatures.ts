import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// AI Recommendations
export const useAIRecommendations = (params: {
  event_type?: string;
  guest_count?: number;
  location?: string;
  budget?: number;
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

// Review Insights
export const useReviewInsights = (vendorId: string) => {
  return useQuery({
    queryKey: ["review-insights", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("review-insights", {
        body: { vendor_id: vendorId },
      });
      if (error) throw error;
      return data.insights;
    },
    enabled: !!vendorId,
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
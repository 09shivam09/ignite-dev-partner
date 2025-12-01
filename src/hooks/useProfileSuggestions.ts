import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileSuggestion {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

interface ProfileSuggestionsResult {
  completionScore: number;
  suggestions: ProfileSuggestion[];
}

export const useProfileSuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ProfileSuggestionsResult | null>(null);

  const getSuggestions = async (profileData: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("profile-suggestions", {
        body: { profileData },
      });

      if (error) throw error;

      setSuggestions(data);
      return data;
    } catch (error: any) {
      console.error("Error getting suggestions:", error);
      if (error.message?.includes("429")) {
        toast.error("Too many requests. Please try again later.");
      } else if (error.message?.includes("402")) {
        toast.error("AI service requires payment.");
      } else {
        toast.error("Failed to get profile suggestions");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getSuggestions, loading, suggestions };
};
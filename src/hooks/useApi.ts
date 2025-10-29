import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// User Profile API
export const useUserProfile = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("user-profile", {
        method: "GET",
      });
      if (error) throw error;
      return data.profile;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileData: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("user-profile", {
        method: "POST",
        body: profileData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
};

// Services API
export const useServices = (filters?: {
  category?: string;
  vendor_id?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["services", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.vendor_id) params.append("vendor_id", filters.vendor_id);
      if (filters?.min_price) params.append("min_price", filters.min_price.toString());
      if (filters?.max_price) params.append("max_price", filters.max_price.toString());
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());

      const { data, error } = await supabase.functions.invoke("services-api", {
        method: "GET",
        body: { params: params.toString() },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useService = (serviceId: string) => {
  return useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        `services-api/${serviceId}`,
        { method: "GET" }
      );
      if (error) throw error;
      return data.service;
    },
    enabled: !!serviceId,
  });
};

// Booking API
export const useBookingHistory = (filters?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: ["booking-history", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.page) params.append("page", filters.page.toString());

      const { data, error } = await supabase.functions.invoke("booking-history", {
        method: "GET",
        body: { params: params.toString() },
      });
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingData: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("booking-create", {
        body: bookingData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
    },
  });
};

export const useManageBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      booking_id: string;
      action: string;
      status?: string;
      cancellation_reason?: string;
      event_date?: string;
      event_time?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("booking-manage", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
    },
  });
};

// Review API
export const useAddReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewData: {
      booking_id: string;
      vendor_id: string;
      rating: number;
      comment?: string;
      images?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke("review-add", {
        body: reviewData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
    },
  });
};

// Offers API
export const useOffers = (filters?: { category?: string; page?: number }) => {
  return useQuery({
    queryKey: ["offers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.page) params.append("page", filters.page.toString());

      const { data, error } = await supabase.functions.invoke("offers-list", {
        method: "GET",
        body: { params: params.toString() },
      });
      if (error) throw error;
      return data;
    },
  });
};

// Vendor Search API
export const useVendorSearch = (searchParams: {
  query?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  minRating?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["vendor-search", searchParams],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("vendor-search", {
        body: searchParams,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!(searchParams.query || searchParams.category),
  });
};

// Payment API
export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentData: {
      booking_id: string;
      payment_method: string;
      payment_provider?: string;
      amount: number;
    }) => {
      const { data, error } = await supabase.functions.invoke("payment-process", {
        body: paymentData,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
};
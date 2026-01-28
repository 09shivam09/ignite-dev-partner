// ============================================
// MARKETPLACE TYPE DEFINITIONS
// ============================================

/**
 * Vendor entity from the vendors table
 */
export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  business_email: string | null;
  business_phone: string | null;
  city: string | null;
  rating: number | null;
  total_reviews: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Event entity from the events table
 */
export interface Event {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  event_date: string | null;
  city: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Service entity from the services table
 */
export interface Service {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/**
 * VendorService entity from the vendor_services table
 */
export interface VendorService {
  id: string;
  vendor_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  price_min: number | null;
  price_max: number | null;
  is_available: boolean;
  services?: Service;
}

/**
 * Profile entity from the profiles table
 */
export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  user_type: string | null;
  city: string | null;
}

/**
 * Inquiry entity from the inquiries table
 */
export interface Inquiry {
  id: string;
  event_id: string;
  vendor_id: string;
  user_id: string;
  message: string | null;
  status: string;
  vendor_response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Inquiry with joined relations for user view
 */
export interface InquiryWithRelations extends Inquiry {
  vendors?: Pick<Vendor, 'id' | 'business_name' | 'city' | 'business_phone'>;
  events?: Pick<Event, 'id' | 'title' | 'event_type' | 'event_date'>;
}

/**
 * Inquiry with joined relations for vendor view
 */
export interface VendorInquiryWithRelations extends Inquiry {
  events?: Pick<Event, 'id' | 'title' | 'event_type' | 'event_date' | 'city' | 'budget_min' | 'budget_max'>;
  profiles?: Pick<Profile, 'full_name' | 'email' | 'phone'>;
}

/**
 * Matched vendor for discovery view
 */
export interface MatchedVendor {
  id: string;
  business_name: string;
  business_description: string | null;
  city: string;
  rating: number | null;
  total_reviews: number | null;
  matchedServices: MatchedService[];
}

/**
 * Matched service with normalized price range
 */
export interface MatchedService {
  name: string;
  price_min: number;
  price_max: number;
}

/**
 * Event service join with service relation
 */
export interface EventServiceWithRelation {
  service_id: string;
  services: Service | null;
}

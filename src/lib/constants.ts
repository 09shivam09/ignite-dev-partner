// Event Marketplace Constants for India

export const CITIES = [
  { value: 'delhi', label: 'Delhi' },
  { value: 'gurugram', label: 'Gurugram' },
  { value: 'noida', label: 'Noida' },
] as const;

export const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'corporate', label: 'Corporate Party' },
  { value: 'kitty-party', label: 'Kitty Party' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'baby-shower', label: 'Baby Shower' },
] as const;

export const USER_ROLES = {
  USER: 'consumer',  // Must match profiles_user_type_check constraint
  VENDOR: 'vendor',
} as const;

export const INQUIRY_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type City = typeof CITIES[number]['value'];
export type EventType = typeof EVENT_TYPES[number]['value'];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type InquiryStatus = typeof INQUIRY_STATUS[keyof typeof INQUIRY_STATUS];

// ============================================
// SHARED HELPER FUNCTIONS
// ============================================

/**
 * Get display label for a city value
 */
export const getCityLabel = (cityValue: string): string => {
  return CITIES.find(c => c.value === cityValue)?.label || cityValue;
};

/**
 * Get display label for an event type value
 */
export const getEventTypeLabel = (typeValue: string): string => {
  return EVENT_TYPES.find(t => t.value === typeValue)?.label || typeValue;
};

/**
 * Format price range with safeguard for inverted values
 * Ensures min <= max for display
 */
export const formatPriceRange = (min: number | null | undefined, max: number | null | undefined): string => {
  const safeMin = min ?? 0;
  const safeMax = max ?? 0;
  
  // Handle inverted ranges by swapping
  const displayMin = Math.min(safeMin, safeMax);
  const displayMax = Math.max(safeMin, safeMax);
  
  if (displayMin === displayMax) {
    return `₹${displayMin.toLocaleString()}`;
  }
  
  return `₹${displayMin.toLocaleString()} - ₹${displayMax.toLocaleString()}`;
};

/**
 * Get status badge variant based on inquiry status
 */
export const getInquiryStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' => {
  switch (status) {
    case INQUIRY_STATUS.ACCEPTED:
      return 'default';
    case INQUIRY_STATUS.REJECTED:
      return 'destructive';
    default:
      return 'secondary';
  }
};

/**
 * Capitalize first letter of a string
 */
export const capitalizeFirst = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ============================================
// MULTI-EVENT MARKETPLACE CONSTANTS
// ============================================

/**
 * Suggested services per event type.
 * Used for dynamic service suggestions during event creation.
 */
export const EVENT_SERVICE_SUGGESTIONS: Record<string, string[]> = {
  wedding: ['Catering', 'Decor', 'Photography', 'DJ', 'Makeup', 'Venue'],
  birthday: ['Catering', 'Decor', 'DJ', 'Photography'],
  corporate: ['Catering', 'Sound', 'Venue', 'Decor'],
  'kitty-party': ['Decor', 'Catering'],
  engagement: ['Decor', 'Photography', 'Catering'],
  'baby-shower': ['Decor', 'Catering', 'Photography'],
};

/**
 * Budget guidance ranges per event type per city (in INR).
 * Gives contextual helper text to users during event creation.
 */
export const BUDGET_GUIDANCE: Record<string, { min: number; max: number; label: string }> = {
  wedding: { min: 200000, max: 2500000, label: 'Most weddings in this area range between ₹2,00,000 – ₹25,00,000' },
  birthday: { min: 15000, max: 200000, label: 'Most birthday parties range between ₹15,000 – ₹2,00,000' },
  corporate: { min: 50000, max: 500000, label: 'Most corporate events range between ₹50,000 – ₹5,00,000' },
  'kitty-party': { min: 10000, max: 100000, label: 'Most kitty parties range between ₹10,000 – ₹1,00,000' },
  engagement: { min: 50000, max: 500000, label: 'Most engagements range between ₹50,000 – ₹5,00,000' },
  'baby-shower': { min: 15000, max: 150000, label: 'Most baby showers range between ₹15,000 – ₹1,50,000' },
};

/**
 * Event checklist: commonly required services per event type
 */
export const EVENT_CHECKLIST: Record<string, string[]> = {
  wedding: ['Venue', 'Catering', 'Photography', 'Decor', 'DJ/Music', 'Makeup', 'Invitations'],
  birthday: ['Venue/Space', 'Catering', 'Decor', 'DJ/Music', 'Photography'],
  corporate: ['Venue', 'Catering', 'AV/Sound', 'Decor', 'Photography'],
  'kitty-party': ['Venue', 'Catering', 'Decor', 'Games/Entertainment'],
  engagement: ['Venue', 'Catering', 'Photography', 'Decor', 'Rings'],
  'baby-shower': ['Venue', 'Catering', 'Decor', 'Photography', 'Games'],
};

/**
 * Event type emoji mapping
 */
export const EVENT_TYPE_EMOJI: Record<string, string> = {
  wedding: '💒',
  birthday: '🎂',
  corporate: '🏢',
  'kitty-party': '🎀',
  engagement: '💍',
  'baby-shower': '🍼',
};

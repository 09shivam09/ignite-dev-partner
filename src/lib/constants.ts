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

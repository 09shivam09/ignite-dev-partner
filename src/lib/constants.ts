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
  USER: 'user',
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

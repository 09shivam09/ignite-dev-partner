/**
 * Smart Event Timeline — Guidance-based planning milestones.
 * Purely informational, no automation.
 */

export interface TimelineMilestone {
  label: string;
  description: string;
  monthsBefore: number;
  services: string[];
}

const WEDDING_TIMELINE: TimelineMilestone[] = [
  { label: 'Venue & Catering', description: 'Book your venue and catering service first — these fill up fastest.', monthsBefore: 3, services: ['Venue', 'Catering'] },
  { label: 'Photography & Decor', description: 'Finalize your photographer and decorator for theme alignment.', monthsBefore: 2, services: ['Photography', 'Decor'] },
  { label: 'Music & Makeup', description: 'Book DJ/music and makeup artists.', monthsBefore: 1.5, services: ['DJ', 'Makeup'] },
  { label: 'Final Confirmations', description: 'Confirm all vendors, review timelines, and settle payments.', monthsBefore: 0.5, services: [] },
];

const BIRTHDAY_TIMELINE: TimelineMilestone[] = [
  { label: 'Venue & Theme', description: 'Secure your venue and decide on a party theme.', monthsBefore: 2, services: ['Venue', 'Decor'] },
  { label: 'Catering & Entertainment', description: 'Book catering and DJ/entertainment.', monthsBefore: 1, services: ['Catering', 'DJ'] },
  { label: 'Final Touches', description: 'Confirm photography, decorations, and guest list.', monthsBefore: 0.5, services: ['Photography'] },
];

const CORPORATE_TIMELINE: TimelineMilestone[] = [
  { label: 'Venue & AV Setup', description: 'Book venue and arrange AV/sound equipment.', monthsBefore: 3, services: ['Venue', 'Sound'] },
  { label: 'Catering & Decor', description: 'Finalize catering menu and corporate branding decor.', monthsBefore: 2, services: ['Catering', 'Decor'] },
  { label: 'Content & Photography', description: 'Arrange event photographer and prepare presentations.', monthsBefore: 1, services: ['Photography'] },
  { label: 'Rehearsal & Final Check', description: 'Do a dry run of the event flow and confirm all vendors.', monthsBefore: 0.25, services: [] },
];

const ENGAGEMENT_TIMELINE: TimelineMilestone[] = [
  { label: 'Venue & Photography', description: 'Book an intimate venue and photographer.', monthsBefore: 2, services: ['Venue', 'Photography'] },
  { label: 'Catering & Decor', description: 'Finalize the menu and decor theme.', monthsBefore: 1, services: ['Catering', 'Decor'] },
  { label: 'Final Confirmations', description: 'Confirm all details and settle payments.', monthsBefore: 0.5, services: [] },
];

const DEFAULT_TIMELINE: TimelineMilestone[] = [
  { label: 'Venue & Core Services', description: 'Book your venue and primary vendors.', monthsBefore: 2, services: ['Venue', 'Catering'] },
  { label: 'Supporting Services', description: 'Add decor, photography, and entertainment.', monthsBefore: 1, services: ['Decor', 'Photography'] },
  { label: 'Final Prep', description: 'Confirm everything and prepare for the day.', monthsBefore: 0.5, services: [] },
];

const TIMELINE_MAP: Record<string, TimelineMilestone[]> = {
  wedding: WEDDING_TIMELINE,
  birthday: BIRTHDAY_TIMELINE,
  corporate: CORPORATE_TIMELINE,
  engagement: ENGAGEMENT_TIMELINE,
  'kitty-party': DEFAULT_TIMELINE,
  'baby-shower': DEFAULT_TIMELINE,
};

export function getEventTimeline(eventType: string): TimelineMilestone[] {
  return TIMELINE_MAP[eventType] || DEFAULT_TIMELINE;
}

/**
 * Determine milestone status based on event date and current date
 */
export function getMilestoneStatus(
  eventDate: string | null,
  monthsBefore: number
): 'upcoming' | 'current' | 'overdue' | 'unknown' {
  if (!eventDate) return 'unknown';

  const event = new Date(eventDate);
  const now = new Date();
  const targetDate = new Date(event);
  targetDate.setMonth(targetDate.getMonth() - monthsBefore);

  const diffDays = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 14) return 'upcoming';
  if (diffDays >= -7) return 'current';
  return 'overdue';
}

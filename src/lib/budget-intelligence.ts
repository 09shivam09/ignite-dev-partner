/**
 * Budget Intelligence Utilities
 * Provides budget health analysis, distribution suggestions, and match scoring.
 * All data is purely informational — no backend side-effects.
 */

import { BUDGET_GUIDANCE, EVENT_SERVICE_SUGGESTIONS } from './constants';

/**
 * Budget health status relative to market data
 */
export type BudgetHealth = 'below' | 'aligned' | 'above';

export interface BudgetHealthResult {
  status: BudgetHealth;
  label: string;
  description: string;
}

/**
 * Evaluate user's budget against market guidance for a given event type
 */
export function getBudgetHealth(
  eventType: string,
  budgetMin: number,
  budgetMax: number
): BudgetHealthResult | null {
  const guide = BUDGET_GUIDANCE[eventType];
  if (!guide) return null;

  const userMid = (budgetMin + budgetMax) / 2;
  const guideMid = (guide.min + guide.max) / 2;

  if (userMid < guide.min * 0.8) {
    return {
      status: 'below',
      label: 'Below Average',
      description: `Your budget is below the typical range for this event type. You may find fewer vendor options.`,
    };
  }
  if (userMid > guide.max * 1.2) {
    return {
      status: 'above',
      label: 'Above Average',
      description: `Your budget is above average — you'll have access to premium vendor options.`,
    };
  }
  return {
    status: 'aligned',
    label: 'Well Aligned',
    description: `Your budget aligns well with typical pricing for this event type.`,
  };
}

/**
 * Suggested budget distribution percentages per event type.
 * Purely informational — helps users plan allocation.
 */
export const BUDGET_DISTRIBUTION: Record<string, { category: string; percent: number }[]> = {
  wedding: [
    { category: 'Catering', percent: 35 },
    { category: 'Venue', percent: 20 },
    { category: 'Decor', percent: 15 },
    { category: 'Photography', percent: 12 },
    { category: 'DJ/Music', percent: 8 },
    { category: 'Makeup', percent: 5 },
    { category: 'Other', percent: 5 },
  ],
  birthday: [
    { category: 'Catering', percent: 35 },
    { category: 'Venue', percent: 25 },
    { category: 'Decor', percent: 20 },
    { category: 'DJ/Music', percent: 10 },
    { category: 'Photography', percent: 10 },
  ],
  corporate: [
    { category: 'Venue', percent: 30 },
    { category: 'Catering', percent: 30 },
    { category: 'AV/Sound', percent: 15 },
    { category: 'Decor', percent: 15 },
    { category: 'Photography', percent: 10 },
  ],
  'kitty-party': [
    { category: 'Venue', percent: 30 },
    { category: 'Catering', percent: 40 },
    { category: 'Decor', percent: 20 },
    { category: 'Entertainment', percent: 10 },
  ],
  engagement: [
    { category: 'Venue', percent: 25 },
    { category: 'Catering', percent: 30 },
    { category: 'Photography', percent: 20 },
    { category: 'Decor', percent: 20 },
    { category: 'Other', percent: 5 },
  ],
  'baby-shower': [
    { category: 'Venue', percent: 25 },
    { category: 'Catering', percent: 35 },
    { category: 'Decor', percent: 20 },
    { category: 'Photography', percent: 10 },
    { category: 'Games', percent: 10 },
  ],
};

/**
 * Calculate a vendor match score (0–100) against an event.
 * Factors: event type support, budget alignment, service coverage, response time.
 */
export interface MatchScoreFactors {
  eventTypeMatch: boolean;
  budgetOverlapPercent: number; // 0-100
  serviceMatchPercent: number;  // 0-100
  responseTimeHours: number | null;
  isAvailable: boolean;
}

export interface MatchScoreResult {
  score: number;
  reasons: string[];
}

export function calculateMatchScore(factors: MatchScoreFactors): MatchScoreResult {
  const reasons: string[] = [];
  let score = 0;

  // Event type support: 25 points
  if (factors.eventTypeMatch) {
    score += 25;
    reasons.push('Supports your event type');
  }

  // Budget alignment: 30 points
  const budgetScore = (factors.budgetOverlapPercent / 100) * 30;
  score += budgetScore;
  if (factors.budgetOverlapPercent >= 80) {
    reasons.push('Within your budget');
  } else if (factors.budgetOverlapPercent >= 50) {
    reasons.push('Partially within budget');
  }

  // Service match: 25 points
  const serviceScore = (factors.serviceMatchPercent / 100) * 25;
  score += serviceScore;
  if (factors.serviceMatchPercent >= 80) {
    reasons.push('Matches your selected services');
  } else if (factors.serviceMatchPercent > 0) {
    reasons.push('Offers some of your required services');
  }

  // Response time: 10 points
  if (factors.responseTimeHours !== null) {
    if (factors.responseTimeHours <= 4) {
      score += 10;
      reasons.push('Fast responder');
    } else if (factors.responseTimeHours <= 12) {
      score += 7;
      reasons.push('Responds within 12 hours');
    } else if (factors.responseTimeHours <= 24) {
      score += 4;
    }
  } else {
    score += 5; // neutral if unknown
  }

  // Availability: 10 points
  if (factors.isAvailable) {
    score += 10;
    reasons.push('Currently available');
  }

  return { score: Math.round(Math.min(100, score)), reasons };
}

/**
 * Get missing service suggestions for a given event type.
 * Returns services commonly needed but not yet selected.
 */
export function getMissingServiceNudges(
  eventType: string,
  selectedServiceNames: string[]
): string[] {
  const suggested = EVENT_SERVICE_SUGGESTIONS[eventType] || [];
  const normalizedSelected = selectedServiceNames.map(n => n.toLowerCase());
  return suggested.filter(s => !normalizedSelected.some(sel => sel.includes(s.toLowerCase())));
}

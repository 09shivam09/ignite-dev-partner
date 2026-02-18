/**
 * Event Readiness Score Calculator
 * Purely informational — no enforcement.
 * Factors: core services, confirmed vendors, budget alignment, timeline proximity.
 */

import { EVENT_SERVICE_SUGGESTIONS, BUDGET_GUIDANCE } from './constants';
import type { VendorLifecycleStatus } from './vendor-lifecycle';

interface ReadinessInput {
  eventType: string;
  selectedServiceCount: number;
  confirmedVendorCount: number;
  shortlistedVendorCount: number;
  budgetMin: number | null;
  budgetMax: number | null;
  eventDate: string | null;
  inquiryCount: number;
}

export interface ReadinessResult {
  score: number; // 0-100
  label: string;
  breakdown: { factor: string; points: number; maxPoints: number; description: string }[];
}

export function calculateReadinessScore(input: ReadinessInput): ReadinessResult {
  const breakdown: ReadinessResult['breakdown'] = [];
  let totalScore = 0;

  // 1. Core services selected (25 points)
  const suggestedCount = (EVENT_SERVICE_SUGGESTIONS[input.eventType] || []).length;
  const serviceCoverage = suggestedCount > 0
    ? Math.min(1, input.selectedServiceCount / suggestedCount)
    : (input.selectedServiceCount > 0 ? 1 : 0);
  const servicePoints = Math.round(serviceCoverage * 25);
  totalScore += servicePoints;
  breakdown.push({
    factor: 'Services Selected',
    points: servicePoints,
    maxPoints: 25,
    description: `${input.selectedServiceCount} service${input.selectedServiceCount !== 1 ? 's' : ''} selected`,
  });

  // 2. Confirmed vendors (30 points)
  // Partial credit for shortlisted/negotiating
  const confirmedPoints = Math.min(30, input.confirmedVendorCount * 10);
  const shortlistBonus = Math.min(10, input.shortlistedVendorCount * 3);
  const vendorPoints = Math.min(30, confirmedPoints + (confirmedPoints < 30 ? shortlistBonus : 0));
  totalScore += vendorPoints;
  breakdown.push({
    factor: 'Vendor Progress',
    points: vendorPoints,
    maxPoints: 30,
    description: `${input.confirmedVendorCount} confirmed, ${input.shortlistedVendorCount} shortlisted`,
  });

  // 3. Budget alignment (20 points)
  const guide = BUDGET_GUIDANCE[input.eventType];
  let budgetPoints = 0;
  if (input.budgetMin && input.budgetMax && guide) {
    const userMid = (input.budgetMin + input.budgetMax) / 2;
    const guideMid = (guide.min + guide.max) / 2;
    const ratio = userMid / guideMid;
    // Best score if within 0.5x to 2x of guide midpoint
    if (ratio >= 0.5 && ratio <= 2) budgetPoints = 20;
    else if (ratio >= 0.3 && ratio <= 3) budgetPoints = 12;
    else budgetPoints = 5;
  } else if (input.budgetMin && input.budgetMax) {
    budgetPoints = 10; // Budget set but no guide
  }
  totalScore += budgetPoints;
  breakdown.push({
    factor: 'Budget Set',
    points: budgetPoints,
    maxPoints: 20,
    description: budgetPoints >= 15 ? 'Well aligned with market' : 'Budget configured',
  });

  // 4. Timeline (15 points)
  let timelinePoints = 0;
  if (input.eventDate) {
    const daysUntil = Math.floor((new Date(input.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 60) timelinePoints = 15;
    else if (daysUntil > 30) timelinePoints = 12;
    else if (daysUntil > 14) timelinePoints = 8;
    else if (daysUntil > 0) timelinePoints = 4;
  }
  totalScore += timelinePoints;
  breakdown.push({
    factor: 'Timeline',
    points: timelinePoints,
    maxPoints: 15,
    description: input.eventDate
      ? `${Math.max(0, Math.floor((new Date(input.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days away`
      : 'No date set',
  });

  // 5. Inquiry activity (10 points)
  const inquiryPoints = Math.min(10, input.inquiryCount * 2);
  totalScore += inquiryPoints;
  breakdown.push({
    factor: 'Vendor Outreach',
    points: inquiryPoints,
    maxPoints: 10,
    description: `${input.inquiryCount} inquir${input.inquiryCount !== 1 ? 'ies' : 'y'} sent`,
  });

  // Label
  let label = 'Getting Started';
  if (totalScore >= 80) label = 'Almost Ready!';
  else if (totalScore >= 60) label = 'Good Progress';
  else if (totalScore >= 40) label = 'Making Progress';
  else if (totalScore >= 20) label = 'Early Stage';

  return { score: Math.min(100, totalScore), label, breakdown };
}

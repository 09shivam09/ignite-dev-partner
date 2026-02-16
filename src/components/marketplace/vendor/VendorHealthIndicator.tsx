import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle,
  Heart
} from "lucide-react";
import { EVENT_TYPES } from "@/lib/constants";
import type { Vendor, VendorService } from "@/types/marketplace";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VendorHealthIndicatorProps {
  vendor: Vendor;
  vendorServices: VendorService[];
  inquiryStats: {
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
}

/**
 * Vendor Health Indicator - Enhanced visibility score
 * Derives health status based on:
 * - Profile completeness (25%)
 * - Inquiry response rate (25%)
 * - Acceptance rate (20%)
 * - Availability status (15%)
 * - Event type coverage (15%)
 */
export const VendorHealthIndicator = ({
  vendor,
  vendorServices,
  inquiryStats,
}: VendorHealthIndicatorProps) => {
  // Profile completeness (0-100)
  const profileScore = (() => {
    let score = 0;
    if (vendor.business_description && vendor.business_description.length > 20) score += 25;
    if (vendorServices.length > 0) score += 25;
    const hasValidPricing = vendorServices.some(s => s.price_min || s.price_max || s.base_price);
    if (hasValidPricing) score += 25;
    if (vendor.city) score += 25;
    return score;
  })();

  // Response rate
  const respondedCount = inquiryStats.accepted + inquiryStats.rejected;
  const needsResponseCount = respondedCount + inquiryStats.pending;
  const responseRate = needsResponseCount > 0 
    ? Math.round((respondedCount / needsResponseCount) * 100)
    : 100;

  // Acceptance rate
  const acceptanceRate = respondedCount > 0
    ? Math.round((inquiryStats.accepted / respondedCount) * 100)
    : 100;

  // Availability factor
  const isAvailable = vendor.is_active;

  // Event type coverage (how many of the 6 types does vendor support)
  const eventTypeCoverage = Math.round(
    ((vendor.supported_event_types?.length || 0) / EVENT_TYPES.length) * 100
  );

  // Calculate overall health (weighted)
  const healthScore = Math.round(
    (profileScore * 0.25) + 
    (responseRate * 0.25) + 
    (acceptanceRate * 0.20) +
    (isAvailable ? 15 : 0) +
    (eventTypeCoverage * 0.15)
  );

  const status: 'good' | 'needs-improvement' = healthScore >= 60 ? 'good' : 'needs-improvement';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-default ${
              status === 'good' 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <Heart className={`h-4 w-4 ${
              status === 'good' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
            }`} />
            <span className="text-sm font-medium">Health</span>
            <Badge 
              variant="secondary"
              className={`text-xs ${
                status === 'good' 
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
              }`}
            >
              {healthScore}
              {status === 'good' ? (
                <CheckCircle2 className="h-3 w-3 ml-1" />
              ) : (
                <AlertCircle className="h-3 w-3 ml-1" />
              )}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {status === 'good' ? 'Good standing' : 'Needs improvement'}
            </p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Profile: {profileScore}%</p>
              <p>Response: {needsResponseCount > 0 ? `${responseRate}%` : 'No data'}</p>
              <p>Acceptance: {respondedCount > 0 ? `${acceptanceRate}%` : 'No data'}</p>
              <p>Status: {isAvailable ? 'Active' : 'Paused'}</p>
              <p>Event types: {vendor.supported_event_types?.length || 0}/{EVENT_TYPES.length}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  Power
} from "lucide-react";
import type { Vendor, VendorService } from "@/types/marketplace";

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
 * Vendor Health Indicator - Compact horizontal layout
 * Derives health status based on:
 * - Profile completeness (40%)
 * - Inquiry response rate (40%)
 * - Availability status (20%)
 */
export const VendorHealthIndicator = ({
  vendor,
  vendorServices,
  inquiryStats,
}: VendorHealthIndicatorProps) => {
  // Calculate profile completeness score (0-100)
  const profileScore = (() => {
    let score = 0;
    if (vendor.business_description && vendor.business_description.length > 20) score += 25;
    if (vendorServices.length > 0) score += 25;
    const hasValidPricing = vendorServices.some(s => s.price_min || s.price_max || s.base_price);
    if (hasValidPricing) score += 25;
    if (vendor.city) score += 25;
    return score;
  })();

  // Calculate response rate
  const respondedCount = inquiryStats.accepted + inquiryStats.rejected;
  const needsResponseCount = respondedCount + inquiryStats.pending;
  const responseRate = needsResponseCount > 0 
    ? Math.round((respondedCount / needsResponseCount) * 100)
    : 100;

  // Availability factor
  const isAvailable = vendor.is_active;

  // Calculate overall health (weighted)
  const healthScore = Math.round(
    (profileScore * 0.4) + 
    (responseRate * 0.4) + 
    (isAvailable ? 20 : 0)
  );

  const status: 'good' | 'needs-improvement' = healthScore >= 60 ? 'good' : 'needs-improvement';

  const factors = [
    {
      label: "Profile",
      value: `${profileScore}%`,
      icon: FileText,
      isGood: profileScore >= 75,
    },
    {
      label: "Response",
      value: needsResponseCount > 0 ? `${responseRate}%` : "—",
      icon: Clock,
      isGood: responseRate >= 70,
    },
    {
      label: "Status",
      value: isAvailable ? "Active" : "Paused",
      icon: Power,
      isGood: isAvailable,
    },
  ];

  return (
    <div className="p-4 rounded-xl border bg-card">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
              status === 'good' 
                ? 'bg-green-500/15 text-green-600 dark:text-green-400' 
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}
          >
            {healthScore}
          </div>
          <div>
            <p className="text-sm font-medium">Vendor Health</p>
            <p className="text-xs text-muted-foreground">Overall score</p>
          </div>
        </div>
        <Badge 
          variant="secondary"
          className={`${
            status === 'good' 
              ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30' 
              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
          }`}
        >
          {status === 'good' ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Good
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3 mr-1" />
              Improve
            </>
          )}
        </Badge>
      </div>

      {/* Factors row */}
      <div className="grid grid-cols-3 gap-2">
        {factors.map((factor, index) => {
          const FactorIcon = factor.icon;
          return (
            <div 
              key={index} 
              className={`flex flex-col items-center p-2 rounded-lg ${
                factor.isGood ? 'bg-green-500/10' : 'bg-amber-500/10'
              }`}
            >
              <FactorIcon className={`h-4 w-4 mb-1 ${
                factor.isGood ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
              }`} />
              <span className={`text-xs font-medium ${
                factor.isGood ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
              }`}>
                {factor.value}
              </span>
              <span className="text-[10px] text-muted-foreground">{factor.label}</span>
            </div>
          );
        })}
      </div>

      {/* Tip */}
      {status === 'needs-improvement' && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Complete your profile and respond quickly to improve your score.
        </p>
      )}
    </div>
  );
};

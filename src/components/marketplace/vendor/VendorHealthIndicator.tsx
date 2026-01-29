import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
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
 * Vendor Health Indicator
 * Derives health status based on:
 * - Profile completeness (40%)
 * - Inquiry response rate (40%)
 * - Availability status (20%)
 * 
 * This is NON-ENFORCING - purely informational
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

  // Calculate response rate (responded / total that needed response)
  const respondedCount = inquiryStats.accepted + inquiryStats.rejected;
  const needsResponseCount = respondedCount + inquiryStats.pending;
  const responseRate = needsResponseCount > 0 
    ? Math.round((respondedCount / needsResponseCount) * 100)
    : 100; // If no inquiries, consider it perfect

  // Availability factor
  const isAvailable = vendor.is_active;

  // Calculate overall health (weighted)
  const healthScore = Math.round(
    (profileScore * 0.4) + 
    (responseRate * 0.4) + 
    (isAvailable ? 20 : 0)
  );

  // Determine status
  const status: 'good' | 'needs-improvement' = healthScore >= 60 ? 'good' : 'needs-improvement';

  const factors = [
    {
      label: "Profile Completeness",
      value: `${profileScore}%`,
      icon: FileText,
      isGood: profileScore >= 75,
    },
    {
      label: "Response Rate",
      value: needsResponseCount > 0 ? `${responseRate}%` : "No data yet",
      icon: Clock,
      isGood: responseRate >= 70,
    },
    {
      label: "Availability",
      value: isAvailable ? "Active" : "Paused",
      icon: Power,
      isGood: isAvailable,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            Vendor Health
          </span>
          <Badge 
            variant={status === 'good' ? 'default' : 'secondary'}
            className={status === 'good' ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}
          >
            {status === 'good' ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Good
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Needs Improvement
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(healthScore / 100) * 251.2} 251.2`}
                className={status === 'good' ? 'text-green-500' : 'text-amber-500'}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{healthScore}</span>
              <span className="text-xs text-muted-foreground">Score</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {factors.map((factor, index) => {
            const FactorIcon = factor.icon;
            return (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <FactorIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{factor.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    factor.isGood ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {factor.value}
                  </span>
                  {factor.isGood ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip */}
        {status === 'needs-improvement' && (
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Complete your profile and respond quickly to inquiries to improve your health score.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

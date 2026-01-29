import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceRange } from "@/lib/constants";
import { AlertCircle } from "lucide-react";
import type { VendorService } from "@/types/marketplace";

interface VendorServicesListProps {
  services: VendorService[];
}

export const VendorServicesList = ({ services }: VendorServicesListProps) => {
  if (services.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">No services added yet</p>
          <p className="text-xs text-muted-foreground">
            Add services to appear in client searches
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check for pricing issues
  const hasInvalidPricing = services.some(
    s => !s.price_min || !s.price_max || s.price_min > s.price_max
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          Your Services
          <Badge variant="secondary">{services.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasInvalidPricing && (
          <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20 mb-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Some services have invalid pricing. Ensure min ≤ max.
            </p>
          </div>
        )}
        
        {services.map((vs) => {
          // Validate and display pricing safely
          const priceMin = vs.price_min ?? vs.base_price ?? 0;
          const priceMax = vs.price_max ?? vs.base_price ?? 0;
          const hasValidPrice = priceMin > 0 && priceMax > 0 && priceMin <= priceMax;

          return (
            <div 
              key={vs.id} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                !hasValidPrice ? 'border-yellow-500/30 bg-yellow-500/5' : 'bg-muted/30'
              }`}
            >
              <div>
                <p className="font-medium text-sm">{vs.services?.name || vs.name}</p>
                {vs.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {vs.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${!hasValidPrice ? 'text-yellow-600' : ''}`}>
                  {formatPriceRange(priceMin, priceMax)}
                </p>
                {!hasValidPrice && (
                  <p className="text-xs text-yellow-600">Invalid range</p>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground pt-2 border-t">
          💡 Clear pricing helps clients make faster decisions
        </p>
      </CardContent>
    </Card>
  );
};

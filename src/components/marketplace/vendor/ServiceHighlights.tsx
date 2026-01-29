import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  TrendingUp, 
  Sparkles,
  IndianRupee,
  Check
} from "lucide-react";
import { formatPriceRange } from "@/lib/constants";
import type { VendorService } from "@/types/marketplace";
import { useState } from "react";

interface ServiceHighlightsProps {
  services: VendorService[];
  onHighlightChange?: (serviceId: string, highlight: 'popular' | 'value' | null) => void;
}

/**
 * Service-Level Highlights
 * Allows vendors to mark services as "Most Popular" or "Best Value"
 * This is UI-only - purely for vendor's self-organization
 */
export const ServiceHighlights = ({
  services,
  onHighlightChange,
}: ServiceHighlightsProps) => {
  // Local state for highlights (in real implementation, this would be persisted)
  const [highlights, setHighlights] = useState<Record<string, 'popular' | 'value' | null>>({});

  const handleToggleHighlight = (serviceId: string, type: 'popular' | 'value') => {
    const currentHighlight = highlights[serviceId];
    const newHighlight = currentHighlight === type ? null : type;
    
    setHighlights(prev => ({
      ...prev,
      [serviceId]: newHighlight,
    }));
    
    onHighlightChange?.(serviceId, newHighlight);
  };

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Add services to highlight your best offerings
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          Service Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground mb-4">
          Mark your top services to help you track your best offerings.
        </p>

        {services.map((service) => {
          const highlight = highlights[service.id];
          const serviceName = service.services?.name || service.name;
          
          return (
            <div 
              key={service.id} 
              className="p-3 rounded-lg border bg-card space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{serviceName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {formatPriceRange(service.price_min, service.price_max)}
                  </p>
                </div>
                
                {highlight && (
                  <Badge 
                    variant="secondary"
                    className={
                      highlight === 'popular' 
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' 
                        : 'bg-green-500/20 text-green-700 dark:text-green-400'
                    }
                  >
                    {highlight === 'popular' ? (
                      <>
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Best Value
                      </>
                    )}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={highlight === 'popular' ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => handleToggleHighlight(service.id, 'popular')}
                >
                  {highlight === 'popular' ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Star className="h-3 w-3 mr-1" />
                  )}
                  Most Popular
                </Button>
                <Button
                  size="sm"
                  variant={highlight === 'value' ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => handleToggleHighlight(service.id, 'value')}
                >
                  {highlight === 'value' ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  )}
                  Best Value
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

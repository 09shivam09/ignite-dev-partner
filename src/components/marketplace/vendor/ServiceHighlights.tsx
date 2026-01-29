import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  TrendingUp, 
  Sparkles,
  IndianRupee
} from "lucide-react";
import { formatPriceRange } from "@/lib/constants";
import type { VendorService } from "@/types/marketplace";
import { useState } from "react";

interface ServiceHighlightsProps {
  services: VendorService[];
  onHighlightChange?: (serviceId: string, highlight: 'popular' | 'value' | null) => void;
}

/**
 * Service-Level Highlights - Compact horizontal layout
 * Allows vendors to mark services as "Most Popular" or "Best Value"
 */
export const ServiceHighlights = ({
  services,
  onHighlightChange,
}: ServiceHighlightsProps) => {
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
      <div className="p-4 rounded-xl border bg-card text-center">
        <Sparkles className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Add services to highlight your best offerings
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Service Highlights</span>
      </div>

      {/* Services list */}
      <div className="space-y-2">
        {services.map((service) => {
          const highlight = highlights[service.id];
          const serviceName = service.services?.name || service.name;
          
          return (
            <div 
              key={service.id} 
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{serviceName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <IndianRupee className="h-3 w-3" />
                  {formatPriceRange(service.price_min, service.price_max)}
                </p>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleToggleHighlight(service.id, 'popular')}
                  className={`p-1.5 rounded-md transition-colors ${
                    highlight === 'popular'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  title="Mark as Most Popular"
                >
                  <Star className="h-4 w-4" fill={highlight === 'popular' ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleToggleHighlight(service.id, 'value')}
                  className={`p-1.5 rounded-md transition-colors ${
                    highlight === 'value'
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  title="Mark as Best Value"
                >
                  <TrendingUp className="h-4 w-4" />
                </button>
              </div>

              {highlight && (
                <Badge 
                  variant="secondary"
                  className={`ml-2 text-[10px] px-1.5 py-0 ${
                    highlight === 'popular' 
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' 
                      : 'bg-green-500/15 text-green-700 dark:text-green-400'
                  }`}
                >
                  {highlight === 'popular' ? 'Popular' : 'Value'}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

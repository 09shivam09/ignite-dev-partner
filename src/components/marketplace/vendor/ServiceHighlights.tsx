import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  TrendingUp, 
  Sparkles
} from "lucide-react";
import type { VendorService } from "@/types/marketplace";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatPriceRange } from "@/lib/constants";
import { IndianRupee } from "lucide-react";

interface ServiceHighlightsProps {
  services: VendorService[];
  onHighlightChange?: (serviceId: string, highlight: 'popular' | 'value' | null) => void;
}

/**
 * Service-Level Highlights - Compact popover trigger
 * Allows vendors to mark services as "Most Popular" or "Best Value"
 */
export const ServiceHighlights = ({
  services,
  onHighlightChange,
}: ServiceHighlightsProps) => {
  const [highlights, setHighlights] = useState<Record<string, 'popular' | 'value' | null>>({});
  const [open, setOpen] = useState(false);

  const handleToggleHighlight = (serviceId: string, type: 'popular' | 'value') => {
    const currentHighlight = highlights[serviceId];
    const newHighlight = currentHighlight === type ? null : type;
    
    setHighlights(prev => ({
      ...prev,
      [serviceId]: newHighlight,
    }));
    
    onHighlightChange?.(serviceId, newHighlight);
  };

  const highlightedCount = Object.values(highlights).filter(Boolean).length;

  if (services.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
        >
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Services</span>
          <Badge variant="secondary" className="text-xs">
            {services.length}
            {highlightedCount > 0 && (
              <Star className="h-3 w-3 ml-1 text-amber-500" fill="currentColor" />
            )}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-1 mb-3">
          <h4 className="text-sm font-medium">Service Highlights</h4>
          <p className="text-xs text-muted-foreground">Mark your top services</p>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
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
                    title="Most Popular"
                  >
                    <Star className="h-3.5 w-3.5" fill={highlight === 'popular' ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleToggleHighlight(service.id, 'value')}
                    className={`p-1.5 rounded-md transition-colors ${
                      highlight === 'value'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    title="Best Value"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

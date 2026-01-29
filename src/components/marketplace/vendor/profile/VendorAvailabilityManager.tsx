import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Loader2, 
  Power, 
  CalendarDays,
  Sun,
  Snowflake
} from "lucide-react";
import type { Vendor } from "@/types/marketplace";

interface VendorAvailabilityManagerProps {
  vendor: Vendor;
  onUpdate: () => void;
}

/**
 * Vendor Availability Manager
 * Controls availability status, busy-until date, and seasonal readiness
 */
export const VendorAvailabilityManager = ({ vendor, onUpdate }: VendorAvailabilityManagerProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // State from vendor data
  const [isActive, setIsActive] = useState(vendor.is_active);
  const [busyUntil, setBusyUntil] = useState<Date | undefined>(undefined);
  const [weddingSeason, setWeddingSeason] = useState(false);
  const [festiveSeason, setFestiveSeason] = useState(false);

  const handleToggleActive = async (checked: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ 
          is_active: checked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (error) throw error;

      setIsActive(checked);
      toast({
        title: checked ? "Now Accepting Inquiries" : "Inquiries Paused",
        description: checked 
          ? "Your profile is now visible to customers" 
          : "You won't receive new inquiries until you resume",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearBusyDate = () => {
    setBusyUntil(undefined);
    toast({
      title: "Busy Date Cleared",
      description: "Your availability schedule has been updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Power className="h-5 w-5" />
          Availability & Status
        </CardTitle>
        <CardDescription>
          Control when you receive inquiries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Availability Toggle */}
        <div className={`p-4 rounded-lg border-2 ${
          isActive ? 'border-green-500/50 bg-green-500/5' : 'border-amber-500/50 bg-amber-500/5'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                isActive ? 'bg-green-500/20' : 'bg-amber-500/20'
              }`}>
                <Power className={`h-5 w-5 ${
                  isActive ? 'text-green-600' : 'text-amber-600'
                }`} />
              </div>
              <div>
                <p className="font-medium">
                  {isActive ? "Accepting Inquiries" : "Inquiries Paused"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isActive 
                    ? "Customers can send you inquiry requests" 
                    : "You won't receive new inquiries"
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleActive}
              disabled={saving}
            />
          </div>
        </div>

        {/* Busy Until Date */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Busy Until (Optional)
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Let customers know if you're booked until a specific date
          </p>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal w-[200px]">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {busyUntil ? format(busyUntil, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={busyUntil}
                  onSelect={setBusyUntil}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {busyUntil && (
              <Button variant="ghost" size="sm" onClick={handleClearBusyDate}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Seasonal Readiness */}
        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              Seasonal Readiness
            </Label>
            <p className="text-xs text-muted-foreground">
              Indicate which seasons you're prepared for (informational only)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Wedding Season */}
            <button
              onClick={() => setWeddingSeason(!weddingSeason)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                weddingSeason 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  weddingSeason ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <Sun className={`h-4 w-4 ${
                    weddingSeason ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Wedding Season</p>
                  <p className="text-xs text-muted-foreground">Oct - Feb</p>
                </div>
                {weddingSeason && (
                  <Badge className="ml-auto">Ready</Badge>
                )}
              </div>
            </button>

            {/* Festive Season */}
            <button
              onClick={() => setFestiveSeason(!festiveSeason)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                festiveSeason 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  festiveSeason ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  <Snowflake className={`h-4 w-4 ${
                    festiveSeason ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Festive Season</p>
                  <p className="text-xs text-muted-foreground">Diwali, Navratri</p>
                </div>
                {festiveSeason && (
                  <Badge className="ml-auto">Ready</Badge>
                )}
              </div>
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Seasonal tags are for your reference only and don't affect matching.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

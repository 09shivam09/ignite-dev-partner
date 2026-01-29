import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Vendor } from "@/types/marketplace";

interface AvailabilityToggleProps {
  vendor: Vendor;
  onUpdate: () => void;
}

export const AvailabilityToggle = ({ vendor, onUpdate }: AvailabilityToggleProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const isActive = vendor.is_active;

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ 
          is_active: checked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (error) throw error;

      toast({
        title: checked ? "You're now visible" : "Paused",
        description: checked 
          ? "Clients can now find and contact you" 
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
      setIsUpdating(false);
    }
  };

  return (
    <Card className={!isActive ? "border-yellow-500/50 bg-yellow-500/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive ? (
              <div className="p-2 rounded-full bg-green-500/10">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-yellow-500/10">
                <EyeOff className="h-5 w-5 text-yellow-500" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="availability" className="font-medium cursor-pointer">
                  Accepting Inquiries
                </Label>
                {isActive ? (
                  <Badge variant="default" className="text-xs bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Paused</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isActive 
                  ? "Clients can find and contact you" 
                  : "You're hidden from search results"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="availability"
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, PartyPopper, Sparkles, Info } from "lucide-react";
import { useState } from "react";

interface SeasonalReadinessToggleProps {
  initialWeddingSeason?: boolean;
  initialFestiveSeason?: boolean;
  onToggle?: (season: 'wedding' | 'festive', value: boolean) => void;
}

/**
 * Seasonal Readiness Toggle
 * Allows vendors to mark readiness for different seasons
 * This is INFORMATIONAL ONLY - does not affect matching logic
 */
export const SeasonalReadinessToggle = ({
  initialWeddingSeason = false,
  initialFestiveSeason = false,
  onToggle,
}: SeasonalReadinessToggleProps) => {
  const [weddingSeason, setWeddingSeason] = useState(initialWeddingSeason);
  const [festiveSeason, setFestiveSeason] = useState(initialFestiveSeason);

  const handleWeddingToggle = (value: boolean) => {
    setWeddingSeason(value);
    onToggle?.('wedding', value);
  };

  const handleFestiveToggle = (value: boolean) => {
    setFestiveSeason(value);
    onToggle?.('festive', value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Seasonal Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Let us know which seasons you're prepared for. This helps you plan your availability.
        </p>

        {/* Wedding Season */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-pink-500/10">
              <Sparkles className="h-4 w-4 text-pink-500" />
            </div>
            <div>
              <Label htmlFor="wedding-season" className="font-medium cursor-pointer">
                Wedding Season
              </Label>
              <p className="text-xs text-muted-foreground">
                Oct - Feb peak wedding months
              </p>
            </div>
          </div>
          <Switch
            id="wedding-season"
            checked={weddingSeason}
            onCheckedChange={handleWeddingToggle}
          />
        </div>

        {/* Festive Season */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/10">
              <PartyPopper className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <Label htmlFor="festive-season" className="font-medium cursor-pointer">
                Festive Season
              </Label>
              <p className="text-xs text-muted-foreground">
                Diwali, Navratri, New Year events
              </p>
            </div>
          </div>
          <Switch
            id="festive-season"
            checked={festiveSeason}
            onCheckedChange={handleFestiveToggle}
          />
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>This is for your planning purposes only and doesn't affect how you appear in search results.</span>
        </div>
      </CardContent>
    </Card>
  );
};

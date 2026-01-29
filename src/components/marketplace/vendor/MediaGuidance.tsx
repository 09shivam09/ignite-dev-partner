import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, CheckCircle2, Info, Camera } from "lucide-react";

/**
 * Media Guidance Component
 * Provides helpful tips for image uploads
 * Does NOT enforce any limits - purely informational
 */
export const MediaGuidance = () => {
  const tips = [
    "Upload 5-10 high-quality photos of your best work",
    "Include a variety: setup shots, close-ups, and full event views",
    "Wedding photos perform best - showcase your signature style",
    "Use well-lit images without heavy filters",
    "Add recent work to keep your portfolio fresh",
  ];

  const bestForEvents = [
    { type: "Wedding", tip: "Decor setups, mandap designs, reception arrangements" },
    { type: "Birthday", tip: "Theme decorations, cake setups, party arrangements" },
    { type: "Corporate", tip: "Professional setups, stage designs, seating arrangements" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Image className="h-4 w-4 text-muted-foreground" />
          Photo Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* General Tips */}
        <div className="space-y-2">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{tip}</span>
            </div>
          ))}
        </div>

        {/* Event-Specific Tips */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Camera className="h-4 w-4 text-muted-foreground" />
            Best photos for each event type
          </div>
          {bestForEvents.map((item, index) => (
            <div key={index} className="pl-6 text-xs">
              <span className="font-medium">{item.type}:</span>{' '}
              <span className="text-muted-foreground">{item.tip}</span>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="flex items-start gap-2 p-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>These are recommendations to help you get more inquiries. Upload as many photos as you'd like!</span>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Vendor Replacement Suggestions — Shown when a vendor rejects an inquiry.
 * Rule-based: same city, event type, service, budget match.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReplacementVendor {
  id: string;
  business_name: string;
  city: string;
  matchedServiceNames: string[];
}

interface VendorReplacementCardProps {
  rejectedVendorName: string;
  replacements: ReplacementVendor[];
  eventId: string;
}

const VendorReplacementCard = ({ rejectedVendorName, replacements, eventId }: VendorReplacementCardProps) => {
  const navigate = useNavigate();

  if (replacements.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-primary" />
          Similar vendors available
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Since {rejectedVendorName} isn't available, here are alternatives:
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {replacements.slice(0, 3).map(vendor => (
            <div key={vendor.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium">{vendor.business_name}</p>
                <div className="flex gap-1 mt-1">
                  {vendor.matchedServiceNames.map(s => (
                    <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs"
                onClick={() => navigate(`/marketplace/vendor/${vendor.id}`)}>
                View <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3 text-xs"
          onClick={() => navigate(`/marketplace/events/${eventId}/vendors`)}>
          Browse All Matching Vendors
        </Button>
      </CardContent>
    </Card>
  );
};

export default VendorReplacementCard;

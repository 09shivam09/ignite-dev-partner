/**
 * Confirmed Vendors Card — Shows vendors marked as "Confirmed" in lifecycle tracking.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users } from "lucide-react";
import { getEventVendorLifecycles } from "@/lib/vendor-lifecycle";
import { useMemo } from "react";

interface ConfirmedVendorsCardProps {
  eventId: string;
  /** Forces re-render when lifecycle changes */
  refreshKey?: number;
}

const ConfirmedVendorsCard = ({ eventId, refreshKey }: ConfirmedVendorsCardProps) => {
  const confirmed = useMemo(() => {
    const lifecycles = getEventVendorLifecycles(eventId);
    return Object.entries(lifecycles)
      .filter(([, data]) => data.status === 'confirmed')
      .map(([vendorId, data]) => ({ vendorId, name: data.vendorName || 'Vendor' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, refreshKey]);

  if (confirmed.length === 0) return null;

  return (
    <Card className="border-success/20 bg-success/[0.02]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-success" />
          Confirmed Vendors
          <Badge variant="outline" className="text-xs ml-auto">{confirmed.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {confirmed.map(v => (
            <div key={v.vendorId} className="flex items-center gap-2 p-2 rounded-lg bg-success/5">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              <span className="text-sm font-medium">{v.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmedVendorsCard;

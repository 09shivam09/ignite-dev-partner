import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  TrendingUp,
  PartyPopper,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getEventTypeLabel } from "@/lib/constants";
import type { VendorInquiryWithRelations } from "@/types/marketplace";

interface VendorMetricsCardsProps {
  newCount: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  totalInquiries: number;
  lastInquiryTime: string | null;
  /** Optional: pass inquiries for event-type breakdown */
  inquiries?: VendorInquiryWithRelations[];
}

export const VendorMetricsCards = ({
  newCount,
  pendingCount,
  acceptedCount,
  rejectedCount,
  totalInquiries,
  lastInquiryTime,
  inquiries,
}: VendorMetricsCardsProps) => {
  // Event type breakdown
  const eventBreakdown = useMemo(() => {
    if (!inquiries || inquiries.length === 0) return [];
    const counts: Record<string, number> = {};
    inquiries.forEach(i => {
      const type = i.events?.event_type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count, label: getEventTypeLabel(type) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [inquiries]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* New Inquiries */}
      <Card className={newCount > 0 ? "border-primary bg-primary/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className={`h-5 w-5 ${newCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            {newCount > 0 && <Badge variant="default" className="text-xs">New</Badge>}
          </div>
          <div className="text-2xl font-bold">{newCount}</div>
          <p className="text-xs text-muted-foreground">New Inquiries</p>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card className={pendingCount > 0 ? "border-yellow-500/50 bg-yellow-500/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className={`h-5 w-5 ${pendingCount > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-2xl font-bold">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">Pending Action</p>
        </CardContent>
      </Card>

      {/* Accepted */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{acceptedCount}</div>
          <p className="text-xs text-muted-foreground">Accepted</p>
        </CardContent>
      </Card>

      {/* Rejected */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{rejectedCount}</div>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </CardContent>
      </Card>

      {/* Total + Last Inquiry */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalInquiries}</div>
              <p className="text-xs text-muted-foreground">Total Inquiries</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Last inquiry</p>
              <p className="text-sm font-medium">
                {lastInquiryTime 
                  ? formatDistanceToNow(new Date(lastInquiryTime), { addSuffix: true })
                  : 'None yet'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Type Breakdown */}
      {eventBreakdown.length > 0 && (
        <Card className="col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">By Event Type</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {eventBreakdown.map(({ type, count, label }) => (
                <Badge key={type} variant="outline" className="gap-1">
                  {label}
                  <span className="font-bold">{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

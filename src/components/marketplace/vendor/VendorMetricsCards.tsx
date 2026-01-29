import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  TrendingUp 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VendorMetricsCardsProps {
  newCount: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  totalInquiries: number;
  lastInquiryTime: string | null;
}

export const VendorMetricsCards = ({
  newCount,
  pendingCount,
  acceptedCount,
  rejectedCount,
  totalInquiries,
  lastInquiryTime,
}: VendorMetricsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* New Inquiries - Most prominent */}
      <Card className={newCount > 0 ? "border-primary bg-primary/5" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className={`h-5 w-5 ${newCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
            {newCount > 0 && (
              <Badge variant="default" className="text-xs">New</Badge>
            )}
          </div>
          <div className="text-2xl font-bold">{newCount}</div>
          <p className="text-xs text-muted-foreground">New Inquiries</p>
        </CardContent>
      </Card>

      {/* Pending Inquiries */}
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

      {/* Total Inquiries - Full width */}
      <Card className="col-span-2 md:col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalInquiries}</div>
              <p className="text-xs text-muted-foreground">Total Inquiries Received</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Inquiry Time */}
      <Card className="col-span-2 md:col-span-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {lastInquiryTime 
                  ? formatDistanceToNow(new Date(lastInquiryTime), { addSuffix: true })
                  : 'No inquiries yet'
                }
              </div>
              <p className="text-xs text-muted-foreground">Last Inquiry Received</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

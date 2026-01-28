import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  getCityLabel, 
  getEventTypeLabel, 
  getInquiryStatusVariant, 
  capitalizeFirst,
  formatPriceRange 
} from "@/lib/constants";
import type { InquiryWithRelations, VendorInquiryWithRelations } from "@/types/marketplace";

// ============================================
// USER VIEW INQUIRY CARD
// ============================================

interface UserInquiryCardProps {
  inquiry: InquiryWithRelations;
}

export const UserInquiryCard = ({ inquiry }: UserInquiryCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{inquiry.vendors?.business_name}</h3>
              <p className="text-sm text-muted-foreground">
                For: {inquiry.events?.title}
              </p>
            </div>
            <Badge variant={getInquiryStatusVariant(inquiry.status)}>
              {capitalizeFirst(inquiry.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {inquiry.events?.event_date 
                ? new Date(inquiry.events.event_date).toLocaleDateString() 
                : 'Date TBD'}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {getCityLabel(inquiry.vendors?.city || '')}
            </div>
          </div>

          {inquiry.message && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-1 text-xs font-medium mb-1">
                <MessageSquare className="h-3 w-3" />
                Your Message
              </div>
              <p className="text-sm">{inquiry.message}</p>
            </div>
          )}

          {inquiry.vendor_response && (
            <div className={`p-3 rounded-lg border ${
              inquiry.status === 'accepted' 
                ? 'bg-primary/5 border-primary/20' 
                : 'bg-destructive/5 border-destructive/20'
            }`}>
              <div className="text-xs font-medium mb-1">Vendor Response</div>
              <p className="text-sm">{inquiry.vendor_response}</p>
            </div>
          )}

          {inquiry.status === 'accepted' && inquiry.vendors?.business_phone && (
            <div className="pt-2 border-t">
              <p className="text-sm">
                <span className="font-medium">Contact:</span> {inquiry.vendors.business_phone}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/marketplace/vendor/${inquiry.vendors?.id}`)}
            >
              View Vendor
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================
// VENDOR VIEW INQUIRY CARD
// ============================================

interface VendorInquiryCardProps {
  inquiry: VendorInquiryWithRelations;
  isPending: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export const VendorInquiryCard = ({ 
  inquiry, 
  isPending, 
  onAccept, 
  onReject 
}: VendorInquiryCardProps) => {
  return (
    <Card className={isPending ? 'border-primary/50' : ''}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{inquiry.events?.title}</h3>
              <Badge variant={getInquiryStatusVariant(inquiry.status)}>
                {capitalizeFirst(inquiry.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {inquiry.events?.event_date 
                  ? new Date(inquiry.events.event_date).toLocaleDateString() 
                  : 'Date TBD'}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {getCityLabel(inquiry.events?.city || '')}
              </div>
              <div>
                {formatPriceRange(inquiry.events?.budget_min, inquiry.events?.budget_max)}
              </div>
              <div>
                {getEventTypeLabel(inquiry.events?.event_type || '')}
              </div>
            </div>

            <div className="text-sm">
              <p className="font-medium">From: {inquiry.profiles?.full_name || 'User'}</p>
              {inquiry.profiles?.email && (
                <p className="text-muted-foreground">{inquiry.profiles.email}</p>
              )}
            </div>

            {inquiry.message && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-1 text-xs font-medium mb-1">
                  <MessageSquare className="h-3 w-3" />
                  Message
                </div>
                <p className="text-sm">{inquiry.message}</p>
              </div>
            )}

            {inquiry.vendor_response && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-xs font-medium mb-1">Your Response</div>
                <p className="text-sm">{inquiry.vendor_response}</p>
              </div>
            )}
          </div>

          {isPending && (
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={onAccept}
              >
                Accept
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={onReject}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

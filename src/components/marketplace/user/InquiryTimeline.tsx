/**
 * Inquiry Timeline View
 * Replaces static status badge with a visual timeline:
 * Sent → Viewed → Responded → Accepted/Rejected/Expired
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, MessageSquare, Check, Clock, Eye, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCityLabel, capitalizeFirst } from "@/lib/constants";
import type { InquiryWithRelations } from "@/types/marketplace";

interface InquiryTimelineProps {
  inquiry: InquiryWithRelations;
}

const TIMELINE_STEPS = ['sent', 'viewed', 'responded'] as const;

const InquiryTimeline = ({ inquiry }: InquiryTimelineProps) => {
  const navigate = useNavigate();

  // Derive timeline state from inquiry data
  const isSent = true; // always sent if it exists
  // Assumption: if vendor responded or accepted/rejected, they viewed it
  const isViewed = inquiry.status !== 'pending' || !!inquiry.vendor_response || !!inquiry.responded_at;
  const isResponded = !!inquiry.vendor_response || inquiry.status === 'accepted' || inquiry.status === 'rejected';
  const finalStatus = inquiry.status;

  const steps = [
    { key: 'sent', label: 'Sent', icon: Send, active: isSent, date: inquiry.created_at },
    { key: 'viewed', label: 'Viewed', icon: Eye, active: isViewed, date: null },
    { key: 'responded', label: 'Responded', icon: MessageSquare, active: isResponded, date: inquiry.responded_at },
  ];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{inquiry.vendors?.business_name}</h3>
              <p className="text-sm text-muted-foreground">For: {inquiry.events?.title}</p>
            </div>
            <Badge
              variant={finalStatus === 'accepted' ? 'default' : finalStatus === 'rejected' ? 'destructive' : 'secondary'}
            >
              {capitalizeFirst(finalStatus)}
            </Badge>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {inquiry.events?.event_date ? new Date(inquiry.events.event_date).toLocaleDateString() : 'Date TBD'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {getCityLabel(inquiry.vendors?.city || '')}
            </span>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className={`flex items-center gap-1.5 ${step.active ? 'text-primary' : 'text-muted-foreground/40'}`}>
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                      step.active ? 'border-primary bg-primary/10' : 'border-muted'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium hidden sm:inline">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${step.active ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
            {/* Final status icon */}
            <div className={`flex items-center gap-1.5 ${
              finalStatus === 'accepted' ? 'text-primary' :
              finalStatus === 'rejected' ? 'text-destructive' : 'text-muted-foreground/40'
            }`}>
              <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                finalStatus === 'accepted' ? 'border-primary bg-primary/10' :
                finalStatus === 'rejected' ? 'border-destructive bg-destructive/10' : 'border-muted'
              }`}>
                {finalStatus === 'accepted' ? <Check className="h-3.5 w-3.5" /> :
                 finalStatus === 'rejected' ? <X className="h-3.5 w-3.5" /> :
                 <Clock className="h-3.5 w-3.5" />}
              </div>
              <span className="text-xs font-medium hidden sm:inline">
                {finalStatus === 'accepted' ? 'Accepted' : finalStatus === 'rejected' ? 'Rejected' : 'Awaiting'}
              </span>
            </div>
          </div>

          {/* Messages */}
          {inquiry.message && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-1 text-xs font-medium mb-1">
                <MessageSquare className="h-3 w-3" />Your Message
              </div>
              <p className="text-sm">{inquiry.message}</p>
            </div>
          )}

          {inquiry.vendor_response && (
            <div className={`p-3 rounded-lg border ${
              inquiry.status === 'accepted' ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'
            }`}>
              <div className="text-xs font-medium mb-1">Vendor Response</div>
              <p className="text-sm">{inquiry.vendor_response}</p>
            </div>
          )}

          {inquiry.status === 'accepted' && inquiry.vendors?.business_phone && (
            <div className="pt-2 border-t">
              <p className="text-sm"><span className="font-medium">Contact:</span> {inquiry.vendors.business_phone}</p>
            </div>
          )}

          <Button variant="outline" size="sm" className="w-fit"
            onClick={() => navigate(`/marketplace/vendor/${inquiry.vendors?.id}`)}>
            View Vendor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InquiryTimeline;

/**
 * Inquiry Timeline View — vertical timeline with purple milestone dots.
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

const InquiryTimeline = ({ inquiry }: InquiryTimelineProps) => {
  const navigate = useNavigate();

  const isSent = true;
  const isViewed = inquiry.status !== 'pending' || !!inquiry.vendor_response || !!inquiry.responded_at;
  const isResponded = !!inquiry.vendor_response || inquiry.status === 'accepted' || inquiry.status === 'rejected';
  const finalStatus = inquiry.status;

  const steps = [
    { key: 'sent', label: 'Sent', icon: Send, active: isSent, date: inquiry.created_at },
    { key: 'viewed', label: 'Viewed', icon: Eye, active: isViewed, date: null },
    { key: 'responded', label: 'Responded', icon: MessageSquare, active: isResponded, date: inquiry.responded_at },
  ];

  return (
    <Card className="hover-lift">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{inquiry.vendors?.business_name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">For: {inquiry.events?.title}</p>
            </div>
            <Badge
              variant={finalStatus === 'accepted' ? 'default' : finalStatus === 'rejected' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {capitalizeFirst(finalStatus)}
            </Badge>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {inquiry.events?.event_date ? new Date(inquiry.events.event_date).toLocaleDateString() : 'Date TBD'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {getCityLabel(inquiry.vendors?.city || '')}
            </span>
          </div>

          {/* Vertical Timeline */}
          <div className="flex flex-col gap-0 pl-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                      step.active
                        ? 'border-primary bg-primary/10'
                        : 'border-muted bg-muted/30'
                    }`}>
                      <Icon className={`h-3.5 w-3.5 ${step.active ? 'text-primary' : 'text-muted-foreground/40'}`} />
                    </div>
                    {index < steps.length && (
                      <div className={`w-0.5 h-5 ${step.active ? 'bg-primary/30' : 'bg-muted'}`} />
                    )}
                  </div>
                  <div className="pb-3">
                    <span className={`text-xs font-medium ${step.active ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {step.label}
                    </span>
                    {step.date && (
                      <p className="text-xs text-muted-foreground/60">
                        {new Date(step.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Final Status */}
            <div className="flex items-start gap-3">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${
                finalStatus === 'accepted' ? 'border-primary bg-primary/10' :
                finalStatus === 'rejected' ? 'border-destructive bg-destructive/10' : 'border-muted'
              }`}>
                {finalStatus === 'accepted' ? <Check className="h-3.5 w-3.5 text-primary" /> :
                 finalStatus === 'rejected' ? <X className="h-3.5 w-3.5 text-destructive" /> :
                 <Clock className="h-3.5 w-3.5 text-muted-foreground/40" />}
              </div>
              <span className={`text-xs font-medium ${
                finalStatus === 'accepted' ? 'text-primary' :
                finalStatus === 'rejected' ? 'text-destructive' : 'text-muted-foreground/50'
              }`}>
                {finalStatus === 'accepted' ? 'Accepted' : finalStatus === 'rejected' ? 'Rejected' : 'Awaiting'}
              </span>
            </div>
          </div>

          {/* Messages */}
          {inquiry.message && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-1 text-xs font-medium mb-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />Your Message
              </div>
              <p className="text-sm">{inquiry.message}</p>
            </div>
          )}

          {inquiry.vendor_response && (
            <div className={`p-3 rounded-lg border ${
              inquiry.status === 'accepted' ? 'bg-primary/5 border-primary/15' : 'bg-destructive/5 border-destructive/15'
            }`}>
              <div className="text-xs font-medium mb-1 text-muted-foreground">Vendor Response</div>
              <p className="text-sm">{inquiry.vendor_response}</p>
            </div>
          )}

          {inquiry.status === 'accepted' && inquiry.vendors?.business_phone && (
            <div className="pt-2 border-t">
              <p className="text-sm"><span className="font-medium">Contact:</span> {inquiry.vendors.business_phone}</p>
            </div>
          )}

          <Button variant="outline" size="sm" className="w-fit text-xs"
            onClick={() => navigate(`/marketplace/vendor/${inquiry.vendors?.id}`)}>
            View Vendor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InquiryTimeline;

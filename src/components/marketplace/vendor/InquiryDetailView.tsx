import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  MapPin, 
  MessageSquare, 
  Check, 
  X, 
  Clock,
  IndianRupee,
  PartyPopper,
  Zap,
  CircleDot,
  Eye,
  CheckCircle2,
  AlertCircle,
  Info,
  StickyNote
} from "lucide-react";
import { 
  getCityLabel, 
  getEventTypeLabel, 
  formatPriceRange,
} from "@/lib/constants";
import { formatDistanceToNow, format } from "date-fns";
import type { VendorInquiryWithRelations } from "@/types/marketplace";
import { useState } from "react";

interface InquiryDetailViewProps {
  inquiry: VendorInquiryWithRelations;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  privateNote?: string;
  onNoteChange?: (note: string) => void;
  onSaveNote?: () => void;
  isSavingNote?: boolean;
}

/**
 * Determines inquiry intent quality based on data completeness
 * HIGH INTENT: Budget, services, and date all provided
 * MEDIUM INTENT: At least one of budget or date provided
 */
const getInquiryIntent = (inquiry: VendorInquiryWithRelations): 'high' | 'medium' => {
  const hasBudget = (inquiry.events?.budget_min ?? 0) > 0 || (inquiry.events?.budget_max ?? 0) > 0;
  const hasDate = !!inquiry.events?.event_date;
  const hasMessage = !!inquiry.message && inquiry.message.length > 10;
  
  // High intent: Has budget AND date
  if (hasBudget && hasDate) return 'high';
  
  // Medium intent: Has at least one key data point
  return 'medium';
};

/**
 * Timeline component showing inquiry progression
 * Uses existing timestamp fields
 */
const InquiryTimeline = ({ inquiry }: { inquiry: VendorInquiryWithRelations }) => {
  const steps = [
    {
      label: "Inquiry Received",
      time: inquiry.created_at,
      icon: MessageSquare,
      completed: true,
    },
    {
      label: "Viewed by You",
      time: new Date().toISOString(), // We show "now" as viewed since they're viewing it
      icon: Eye,
      completed: true,
    },
    {
      label: inquiry.status === 'accepted' ? "Accepted" : inquiry.status === 'rejected' ? "Rejected" : "Awaiting Response",
      time: inquiry.responded_at,
      icon: inquiry.status === 'accepted' ? CheckCircle2 : inquiry.status === 'rejected' ? X : Clock,
      completed: inquiry.status !== 'pending',
    },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        Inquiry Timeline
      </h4>
      <div className="relative pl-6 space-y-4">
        {/* Vertical line */}
        <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-border" />
        
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <div key={index} className="relative flex items-start gap-3">
              {/* Dot */}
              <div className={`absolute -left-4 p-1 rounded-full ${
                step.completed 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                <StepIcon className="h-3 w-3" />
              </div>
              
              {/* Content */}
              <div className="ml-2">
                <p className={`text-sm font-medium ${
                  step.completed ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
                {step.time && step.completed && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(step.time), 'MMM d, yyyy • h:mm a')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const InquiryDetailView = ({
  inquiry,
  onAccept,
  onReject,
  onClose,
  privateNote = "",
  onNoteChange,
  onSaveNote,
  isSavingNote,
}: InquiryDetailViewProps) => {
  const intent = getInquiryIntent(inquiry);
  const isPending = inquiry.status === 'pending';
  const isAccepted = inquiry.status === 'accepted';

  return (
    <div className="space-y-6">
      {/* Intent Badge */}
      <div className="flex items-center justify-between">
        <Badge 
          variant={intent === 'high' ? 'default' : 'secondary'}
          className={intent === 'high' ? 'bg-green-500 hover:bg-green-600' : ''}
        >
          <Zap className="h-3 w-3 mr-1" />
          {intent === 'high' ? 'High Intent' : 'Medium Intent'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Event Details */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">{inquiry.events?.title}</h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <PartyPopper className="h-4 w-4 flex-shrink-0" />
              <span>{getEventTypeLabel(inquiry.events?.event_type || '')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{getCityLabel(inquiry.events?.city || '')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>
                {inquiry.events?.event_date 
                  ? format(new Date(inquiry.events.event_date), 'MMM d, yyyy')
                  : 'Date TBD'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="h-4 w-4 flex-shrink-0" />
              <span>{formatPriceRange(inquiry.events?.budget_min, inquiry.events?.budget_max)}</span>
            </div>
          </div>

          {/* Client Info */}
          <Separator />
          <div>
            <p className="text-sm">
              <span className="font-medium">From:</span>{' '}
              {inquiry.profiles?.full_name || 'Client'}
              {isAccepted && inquiry.profiles?.email && (
                <span className="text-muted-foreground ml-2">
                  ({inquiry.profiles.email})
                </span>
              )}
            </p>
          </div>

          {/* Client Message */}
          {inquiry.message && (
            <>
              <Separator />
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                  <MessageSquare className="h-3 w-3" />
                  Client Message
                </div>
                <p className="text-sm">{inquiry.message}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Context Explanation - Informational only */}
      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            You received this inquiry because your services and price range match 
            the event requirements in your city.
          </p>
        </div>
      </div>

      {/* Soft SLA Indicator */}
      {isPending && (
        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-amber-600 dark:text-amber-400">Quick Tip:</span>{' '}
              Responding quickly improves your chances of conversion.
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardContent className="p-4">
          <InquiryTimeline inquiry={inquiry} />
        </CardContent>
      </Card>

      {/* Contact Readiness Message */}
      {isPending && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <CircleDot className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Note:</span> Contact details will be shared 
              with the client after you accept this inquiry.
            </p>
          </div>
        </div>
      )}

      {/* Next Steps Message (after acceptance) */}
      {isAccepted && (
        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-green-700 dark:text-green-400">Inquiry Accepted!</p>
              <p className="text-muted-foreground mt-1">
                The client can now see your contact details and may reach out directly to discuss the event.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Response (if responded) */}
      {inquiry.vendor_response && (
        <Card>
          <CardContent className={`p-4 ${
            isAccepted ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="text-xs font-medium mb-1">Your Response</div>
            <p className="text-sm">{inquiry.vendor_response}</p>
          </CardContent>
        </Card>
      )}

      {/* Private Notes Section */}
      {onNoteChange && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="private-note" className="flex items-center gap-2 text-sm font-medium">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              Private Notes
              <span className="text-xs text-muted-foreground font-normal">(only visible to you)</span>
            </Label>
            <Textarea
              id="private-note"
              placeholder="Add any notes about this inquiry for your reference..."
              value={privateNote}
              onChange={(e) => onNoteChange(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            {onSaveNote && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onSaveNote}
                disabled={isSavingNote}
              >
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {isPending && (
        <div className="flex gap-3">
          <Button onClick={onAccept} className="flex-1 gap-2">
            <Check className="h-4 w-4" />
            Accept Inquiry
          </Button>
          <Button variant="outline" onClick={onReject} className="flex-1 gap-2">
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      )}

      {!isPending && (
        <Button variant="outline" onClick={onClose} className="w-full">
          Close
        </Button>
      )}
    </div>
  );
};

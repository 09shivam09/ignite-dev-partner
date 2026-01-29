import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Check, X, ArrowRight } from "lucide-react";
import type { VendorInquiryWithRelations } from "@/types/marketplace";

interface InquiryActionDialogProps {
  inquiry: VendorInquiryWithRelations | null;
  actionType: 'accept' | 'reject' | null;
  responseMessage: string;
  onResponseChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export const InquiryActionDialog = ({
  inquiry,
  actionType,
  responseMessage,
  onResponseChange,
  onConfirm,
  onClose,
  isSubmitting,
}: InquiryActionDialogProps) => {
  const isAccepting = actionType === 'accept';

  return (
    <Dialog open={!!inquiry && !!actionType} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAccepting ? (
              <>
                <Check className="h-5 w-5 text-green-500" />
                Accept Inquiry
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-red-500" />
                Reject Inquiry
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isAccepting 
              ? "The client will receive your acceptance and can proceed to contact you."
              : "The client will be notified that you've declined their inquiry."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="response">Response Message (optional)</Label>
            <Textarea
              id="response"
              placeholder={isAccepting 
                ? "Great! I'd love to work on your event. Here's what we can offer..."
                : "Thank you for your interest. Unfortunately, we're unable to take on this event because..."
              }
              value={responseMessage}
              onChange={(e) => onResponseChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {isAccepting 
                ? "💡 Share your availability, next steps, or any questions"
                : "💡 A brief explanation helps maintain good relationships"}
            </p>
          </div>

          {isAccepting && (
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-400">Next Steps</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    After accepting, the client will see your contact details and can reach out to finalize the booking.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isSubmitting}
            variant={isAccepting ? 'default' : 'destructive'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isAccepting ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept Inquiry
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Reject Inquiry
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

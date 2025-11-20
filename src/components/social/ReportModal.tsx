import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading', description: 'Promotional content, scams, or fake information' },
  { value: 'harassment', label: 'Harassment or hate speech', description: 'Bullying, threats, or discriminatory content' },
  { value: 'inappropriate', label: 'Inappropriate content', description: 'Adult content, nudity, or offensive material' },
  { value: 'violence', label: 'Violence or dangerous content', description: 'Graphic violence or harmful activities' },
  { value: 'misinformation', label: 'False information', description: 'Deliberately misleading or false claims' },
  { value: 'other', label: 'Other', description: 'Something else that violates community guidelines' },
];

export function ReportModal({ postId, open, onOpenChange }: ReportModalProps) {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    // Input validation
    if (description.length > 500) {
      toast.error('Description must be less than 500 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('report-post', {
        body: {
          post_id: postId,
          reason: reason.trim(),
          description: description.trim() || null,
        },
      });

      if (error) {
        if (error.message.includes('Rate limit')) {
          toast.error('You can only submit 5 reports per hour. Please try again later.');
        } else if (error.message.includes('already reported')) {
          toast.error('You have already reported this post');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Thank you for your report. Our team will review it shortly.');
      onOpenChange(false);
      
      // Reset form
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Report Post</DialogTitle>
          </div>
          <DialogDescription>
            Help us keep the community safe. All reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>Why are you reporting this post?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor={option.value}
                      className="font-medium cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Provide more context about why this post should be reviewed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500 characters
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground">
            <p>
              Your report is anonymous. The post author will not be notified of your report.
              Our moderation team will review this report according to our community guidelines.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reason || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

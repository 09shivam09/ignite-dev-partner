import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, AlertCircle, ArrowRight } from "lucide-react";
import type { Vendor, VendorService } from "@/types/marketplace";

interface ProfileCompletionCardProps {
  vendor: Vendor;
  vendorServices: VendorService[];
  portfolioCount?: number;
  onEditProfile?: () => void;
}

interface CompletionItem {
  label: string;
  completed: boolean;
  hint?: string;
}

export const ProfileCompletionCard = ({ 
  vendor, 
  vendorServices, 
  portfolioCount = 0,
  onEditProfile 
}: ProfileCompletionCardProps) => {
  // Calculate completion items based on new requirements
  const completionItems: CompletionItem[] = [
    {
      label: "Business name",
      completed: !!vendor.business_name && vendor.business_name.length > 2,
      hint: "Add your business/brand name",
    },
    {
      label: "Business description",
      completed: !!vendor.business_description && vendor.business_description.length >= 50,
      hint: "Add a detailed description (at least 50 characters)",
    },
    {
      label: "At least one service",
      completed: vendorServices.length > 0,
      hint: "Add at least one service offering",
    },
    {
      label: "Price range set",
      completed: vendorServices.some(s => s.price_min && s.price_max && s.price_min > 0),
      hint: "Set valid price ranges for your services",
    },
    {
      label: "City selected",
      completed: !!vendor.city,
      hint: "Select your service city",
    },
    {
      label: "Contact phone",
      completed: !!vendor.business_phone,
      hint: "Add your business phone number",
    },
    {
      label: "Portfolio images (3+)",
      completed: portfolioCount >= 3,
      hint: `Add at least 3 portfolio images (${portfolioCount}/3)`,
    },
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const percentage = Math.round((completedCount / completionItems.length) * 100);

  const isComplete = percentage === 100;
  const incompleteItems = completionItems.filter(item => !item.completed);

  return (
    <Card className={!isComplete ? "border-amber-500/30" : "border-green-500/30"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            Profile Completion
          </CardTitle>
          <span className={`text-sm font-bold ${isComplete ? 'text-green-500' : 'text-amber-500'}`}>
            {percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} className="h-2" />
        
        {/* Show incomplete items first, then completed */}
        <div className="space-y-2">
          {incompleteItems.slice(0, 3).map((item, index) => (
            <div 
              key={index} 
              className="flex items-start gap-2 text-sm"
            >
              <Circle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-foreground">{item.label}</span>
                {item.hint && (
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                )}
              </div>
            </div>
          ))}
          
          {incompleteItems.length > 3 && (
            <p className="text-xs text-muted-foreground pl-6">
              +{incompleteItems.length - 3} more items to complete
            </p>
          )}

          {isComplete && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>All profile sections complete!</span>
            </div>
          )}
        </div>

        {!isComplete && onEditProfile && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={onEditProfile}
          >
            Complete Profile
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {!isComplete && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            💡 Complete profiles receive more inquiries and build customer trust
          </p>
        )}
      </CardContent>
    </Card>
  );
};

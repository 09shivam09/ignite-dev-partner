import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { Vendor, VendorService } from "@/types/marketplace";

interface ProfileCompletionCardProps {
  vendor: Vendor;
  vendorServices: VendorService[];
}

interface CompletionItem {
  label: string;
  completed: boolean;
  hint?: string;
}

export const ProfileCompletionCard = ({ vendor, vendorServices }: ProfileCompletionCardProps) => {
  // Calculate completion items
  const completionItems: CompletionItem[] = [
    {
      label: "Business description",
      completed: !!vendor.business_description && vendor.business_description.length > 20,
      hint: "Add a detailed description (at least 20 characters)",
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
  ];

  const completedCount = completionItems.filter(item => item.completed).length;
  const percentage = Math.round((completedCount / completionItems.length) * 100);

  const isComplete = percentage === 100;

  return (
    <Card className={!isComplete ? "border-yellow-500/30" : "border-green-500/30"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Profile Completion
          </CardTitle>
          <span className={`text-sm font-bold ${isComplete ? 'text-green-500' : 'text-yellow-500'}`}>
            {percentage}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} className="h-2" />
        
        <div className="space-y-2">
          {completionItems.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-start gap-2 text-sm ${
                item.completed ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              )}
              <span className={item.completed ? 'line-through' : ''}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {!isComplete && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            💡 Complete your profile to improve visibility and attract more clients
          </p>
        )}
      </CardContent>
    </Card>
  );
};

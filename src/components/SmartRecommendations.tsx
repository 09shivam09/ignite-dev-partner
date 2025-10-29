import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";
import { useAIRecommendations } from "@/hooks/useSmartFeatures";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface SmartRecommendationsProps {
  eventType?: string;
  guestCount?: number;
  location?: string;
  budget?: number;
}

export const SmartRecommendations = ({ 
  eventType, 
  guestCount, 
  location, 
  budget 
}: SmartRecommendationsProps) => {
  const navigate = useNavigate();
  const { data, isLoading } = useAIRecommendations({
    event_type: eventType,
    guest_count: guestCount,
    location,
    budget,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data?.recommendations || data.recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">AI-Powered Recommendations</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.recommendations.map((rec: any, index: number) => (
          <Card key={index} className="hover:border-primary transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{rec.service_type}</CardTitle>
                  <CardDescription>{rec.reason}</CardDescription>
                </div>
                <Badge variant={
                  rec.priority === 'high' ? 'default' : 
                  rec.priority === 'medium' ? 'secondary' : 
                  'outline'
                }>
                  {rec.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {rec.estimated_budget > 0 && (
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Estimated: ₹{rec.estimated_budget.toLocaleString()}
                </div>
              )}

              {rec.available_services && rec.available_services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Available Services:</p>
                  {rec.available_services.slice(0, 2).map((service: any) => (
                    <Button
                      key={service.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => navigate(`/vendor/${service.vendor_id}`)}
                    >
                      <span className="truncate">{service.name}</span>
                      <span className="text-primary">₹{service.base_price}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
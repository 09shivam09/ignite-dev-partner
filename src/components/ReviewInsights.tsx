import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, ThumbsUp, AlertCircle } from "lucide-react";
import { useReviewInsights } from "@/hooks/useSmartFeatures";
import { Skeleton } from "@/components/ui/skeleton";

interface ReviewInsightsProps {
  vendorId: string;
}

export const ReviewInsights = ({ vendorId }: ReviewInsightsProps) => {
  // Validate UUID format before making API call
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorId);
  const { data: insights, isLoading } = useReviewInsights(vendorId);

  // Don't show for non-UUID vendor IDs (mock data)
  if (!isValidUUID) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!insights) {
    return null;
  }

  const sentimentColor = 
    insights.sentiment === 'positive' ? 'text-green-600' :
    insights.sentiment === 'negative' ? 'text-red-600' :
    'text-yellow-600';

  const sentimentBg = 
    insights.sentiment === 'positive' ? 'bg-green-100' :
    insights.sentiment === 'negative' ? 'bg-red-100' :
    'bg-yellow-100';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            AI Review Insights
          </CardTitle>
          {insights.percentage_satisfied !== undefined && (
            <Badge className={`${sentimentBg} ${sentimentColor}`}>
              {insights.percentage_satisfied}% Satisfied
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div>
          <p className="text-sm text-muted-foreground">{insights.summary}</p>
          {insights.total_reviews && (
            <p className="mt-2 text-xs text-muted-foreground">
              Based on {insights.total_reviews} reviews
            </p>
          )}
        </div>

        {/* Rating Breakdown */}
        {insights.rating_breakdown && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Rating Distribution</h4>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = insights.rating_breakdown[rating as keyof typeof insights.rating_breakdown] || 0;
              const percentage = insights.total_reviews 
                ? (count / insights.total_reviews) * 100 
                : 0;
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}★</span>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Strengths */}
        {insights.strengths && insights.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <ThumbsUp className="h-4 w-4 text-green-600" />
              Key Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {insights.strengths.map((strength: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Areas for Improvement */}
        {insights.areas_for_improvement && insights.areas_for_improvement.length > 0 && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Areas for Improvement
            </h4>
            <div className="flex flex-wrap gap-2">
              {insights.areas_for_improvement.map((area: string, index: number) => (
                <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Popular Phrases */}
        {insights.popular_phrases && insights.popular_phrases.length > 0 && (
          <div>
            <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              Commonly Mentioned
            </h4>
            <div className="flex flex-wrap gap-2">
              {insights.popular_phrases.slice(0, 5).map((phrase: string, index: number) => (
                <Badge key={index} variant="outline">
                  "{phrase}"
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
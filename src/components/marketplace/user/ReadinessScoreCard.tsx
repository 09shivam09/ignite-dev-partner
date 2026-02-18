/**
 * Event Readiness Score Card — Informational only.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Gauge } from "lucide-react";
import type { ReadinessResult } from "@/lib/readiness-score";

interface ReadinessScoreCardProps {
  readiness: ReadinessResult;
}

const ReadinessScoreCard = ({ readiness }: ReadinessScoreCardProps) => {
  const scoreColor = readiness.score >= 80 ? 'text-success' :
    readiness.score >= 50 ? 'text-primary' :
    readiness.score >= 25 ? 'text-warning' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Event Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score ring */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${readiness.score * 2.136} 213.6`}
                className="transition-all duration-700"
              />
            </svg>
            <span className={`absolute text-xl font-bold ${scoreColor}`}>{readiness.score}%</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{readiness.label}</p>
            <p className="text-xs text-muted-foreground">Based on your planning progress</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2.5">
          {readiness.breakdown.map((item) => (
            <div key={item.factor} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{item.factor}</span>
                <span className="text-muted-foreground">{item.points}/{item.maxPoints}</span>
              </div>
              <Progress value={(item.points / item.maxPoints) * 100} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadinessScoreCard;

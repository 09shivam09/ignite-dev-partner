/**
 * Smart Event Timeline — Guidance-based milestone suggestions.
 * Purely informational, no automation.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { getEventTimeline, getMilestoneStatus } from "@/lib/event-timeline";
import { getEventTypeLabel } from "@/lib/constants";

interface SmartTimelineProps {
  eventType: string;
  eventDate: string | null;
}

const STATUS_STYLES = {
  upcoming: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/50', badge: 'secondary' as const },
  current: { icon: Clock, color: 'text-primary', bg: 'bg-primary/5', badge: 'default' as const },
  overdue: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/5', badge: 'destructive' as const },
  unknown: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/50', badge: 'secondary' as const },
};

const SmartTimeline = ({ eventType, eventDate }: SmartTimelineProps) => {
  const milestones = getEventTimeline(eventType);

  if (milestones.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Planning Timeline
        </CardTitle>
        <CardDescription className="text-xs">
          Suggested milestones for {getEventTypeLabel(eventType)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {milestones.map((milestone, index) => {
              const status = getMilestoneStatus(eventDate, milestone.monthsBefore);
              const styles = STATUS_STYLES[status];
              const Icon = styles.icon;

              return (
                <div key={index} className={`relative flex gap-4 p-3 rounded-xl transition-colors ${styles.bg}`}>
                  <div className="relative z-10 flex-shrink-0 mt-0.5">
                    <Icon className={`h-[30px] w-[30px] p-1.5 rounded-full bg-background border ${styles.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{milestone.label}</p>
                      <Badge variant={styles.badge} className="text-[10px] px-1.5 py-0">
                        {milestone.monthsBefore >= 1
                          ? `${milestone.monthsBefore}mo before`
                          : `${Math.round(milestone.monthsBefore * 4)}wk before`}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    {milestone.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {milestone.services.map(s => (
                          <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartTimeline;

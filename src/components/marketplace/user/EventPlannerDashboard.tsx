/**
 * Event Control Dashboard — Centralized event management view.
 * Features: Event summary, budget overview, vendor status, readiness score,
 * smart timeline, confirmed vendors, planning checklist.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar, MapPin, IndianRupee, CheckCircle2, Circle, AlertCircle,
  ArrowRight, Lightbulb, TrendingUp, TrendingDown, Minus,
  Search, ClipboardList, Wallet
} from "lucide-react";
import { getCityLabel, getEventTypeLabel, formatPriceRange, EVENT_CHECKLIST, EVENT_TYPE_EMOJI } from "@/lib/constants";
import { getBudgetHealth, BUDGET_DISTRIBUTION, getMissingServiceNudges } from "@/lib/budget-intelligence";
import { calculateReadinessScore } from "@/lib/readiness-score";
import { getLifecycleCounts, getEventVendorLifecycles } from "@/lib/vendor-lifecycle";
import ReadinessScoreCard from "./ReadinessScoreCard";
import SmartTimeline from "./SmartTimeline";
import ConfirmedVendorsCard from "./ConfirmedVendorsCard";
import type { Event } from "@/types/marketplace";

/** Client-side checklist item status */
type ChecklistStatus = 'pending' | 'shortlisted' | 'booked';

interface EventPlannerDashboardProps {
  event: Event;
  eventServices: { service_id: string; services: { id: string; name: string } | null }[];
  inquiries: { id: string; vendor_id: string; status: string }[];
}

const EventPlannerDashboard = ({ event, eventServices, inquiries }: EventPlannerDashboardProps) => {
  const navigate = useNavigate();

  const checklistItems = useMemo(() => EVENT_CHECKLIST[event.event_type || ''] || [], [event.event_type]);
  const [checklistState, setChecklistState] = useState<Record<string, ChecklistStatus>>({});
  const [lifecycleRefreshKey, setLifecycleRefreshKey] = useState(0);

  const toggleChecklist = (item: string) => {
    setChecklistState(prev => {
      const current = prev[item] || 'pending';
      const next: ChecklistStatus = current === 'pending' ? 'shortlisted' : current === 'shortlisted' ? 'booked' : 'pending';
      return { ...prev, [item]: next };
    });
  };

  // Budget health
  const budgetHealth = useMemo(() => {
    if (!event.event_type || !event.budget_min || !event.budget_max) return null;
    return getBudgetHealth(event.event_type, event.budget_min, event.budget_max);
  }, [event]);

  // Budget distribution
  const distribution = useMemo(() => {
    if (!event.event_type) return [];
    return BUDGET_DISTRIBUTION[event.event_type] || [];
  }, [event.event_type]);

  // Missing service nudges
  const selectedServiceNames = eventServices.map(es => es.services?.name || '');
  const missingNudges = useMemo(() => {
    if (!event.event_type) return [];
    return getMissingServiceNudges(event.event_type, selectedServiceNames);
  }, [event.event_type, selectedServiceNames]);

  // Inquiry progress
  const inquiryStats = useMemo(() => ({
    total: inquiries.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    accepted: inquiries.filter(i => i.status === 'accepted').length,
    rejected: inquiries.filter(i => i.status === 'rejected').length,
  }), [inquiries]);

  // Vendor lifecycle counts
  const lifecycleCounts = useMemo(() => {
    return getLifecycleCounts(event.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, lifecycleRefreshKey]);

  // Readiness Score
  const readiness = useMemo(() => {
    return calculateReadinessScore({
      eventType: event.event_type || '',
      selectedServiceCount: eventServices.length,
      confirmedVendorCount: lifecycleCounts.confirmed,
      shortlistedVendorCount: lifecycleCounts.shortlisted + lifecycleCounts.negotiating,
      budgetMin: event.budget_min,
      budgetMax: event.budget_max,
      eventDate: event.event_date,
      inquiryCount: inquiryStats.total,
    });
  }, [event, eventServices.length, lifecycleCounts, inquiryStats.total]);

  // Planning progress
  const planningProgress = useMemo(() => {
    if (checklistItems.length === 0) return 0;
    const bookedCount = checklistItems.filter(item => checklistState[item] === 'booked').length;
    return Math.round((bookedCount / checklistItems.length) * 100);
  }, [checklistItems, checklistState]);

  const budgetMid = ((event.budget_min || 0) + (event.budget_max || 0)) / 2;

  // Estimated confirmed vendor cost (dummy — informational)
  const confirmedVendors = useMemo(() => {
    return getEventVendorLifecycles(event.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, lifecycleRefreshKey]);

  return (
    <div className="space-y-6">
      {/* Event Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{EVENT_TYPE_EMOJI[event.event_type || ''] || '🎉'}</span>
              <div>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>{getEventTypeLabel(event.event_type || '')}</CardDescription>
              </div>
            </div>
            <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>{event.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {getCityLabel(event.city || '')}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
              {formatPriceRange(event.budget_min, event.budget_max)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              {eventServices.length} service{eventServices.length !== 1 ? 's' : ''} selected
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {eventServices.map(es => (
              <Badge key={es.service_id} variant="outline">{es.services?.name}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Overview + Readiness Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Budget Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Budget Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-primary/5 text-center">
                <p className="text-lg font-bold">₹{((event.budget_min || 0) + (event.budget_max || 0)) / 2 > 100000
                  ? `${(((event.budget_min || 0) + (event.budget_max || 0)) / 200000).toFixed(1)}L`
                  : Math.round(((event.budget_min || 0) + (event.budget_max || 0)) / 2).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Est. Budget</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-center">
                <p className="text-lg font-bold">{lifecycleCounts.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmed Vendors</p>
              </div>
            </div>
            {budgetHealth && (
              <div className="flex items-center gap-2 text-sm">
                {budgetHealth.status === 'below' && <TrendingDown className="h-4 w-4 text-destructive" />}
                {budgetHealth.status === 'aligned' && <Minus className="h-4 w-4 text-primary" />}
                {budgetHealth.status === 'above' && <TrendingUp className="h-4 w-4 text-secondary" />}
                <span className="font-medium">{budgetHealth.label}</span>
                <span className="text-muted-foreground text-xs">— {budgetHealth.description}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Readiness Score */}
        <ReadinessScoreCard readiness={readiness} />
      </div>

      {/* Vendor Status Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vendor Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {[
              { label: 'Shortlisted', value: lifecycleCounts.shortlisted, color: 'text-gold' },
              { label: 'Negotiating', value: lifecycleCounts.negotiating, color: 'text-primary' },
              { label: 'Confirmed', value: lifecycleCounts.confirmed, color: 'text-success' },
              { label: 'Rejected', value: lifecycleCounts.rejected, color: 'text-destructive' },
              { label: 'Inquiries Sent', value: inquiryStats.total, color: 'text-foreground' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-muted/50">
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmed Vendors */}
      <ConfirmedVendorsCard eventId={event.id} refreshKey={lifecycleRefreshKey} />

      {/* Smart Timeline + Budget Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {event.event_type && (
          <SmartTimeline eventType={event.event_type} eventDate={event.event_date} />
        )}

        {distribution.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Suggested Budget Split</CardTitle>
              <CardDescription className="text-xs">Typical allocation for {getEventTypeLabel(event.event_type || '')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {distribution.map(d => (
                  <div key={d.category} className="flex items-center justify-between text-sm">
                    <span>{d.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">~₹{Math.round(budgetMid * d.percent / 100).toLocaleString()}</span>
                      <Badge variant="outline" className="text-xs">{d.percent}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Missing Service Nudges */}
      {missingNudges.length > 0 && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">You might also need</p>
              <p className="text-sm text-muted-foreground">
                Most {getEventTypeLabel(event.event_type || '')} events also include:{' '}
                {missingNudges.join(', ')}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planning Checklist & Inquiry Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklistItems.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Planning Checklist</CardTitle>
                <Badge variant="outline">{planningProgress}% complete</Badge>
              </div>
              <Progress value={planningProgress} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checklistItems.map(item => {
                  const status = checklistState[item] || 'pending';
                  return (
                    <button
                      key={item}
                      onClick={() => toggleChecklist(item)}
                      className="flex items-center gap-3 w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {status === 'booked' && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                      {status === 'shortlisted' && <AlertCircle className="h-4 w-4 text-secondary flex-shrink-0" />}
                      {status === 'pending' && <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <span className={`text-sm ${status === 'booked' ? 'line-through text-muted-foreground' : ''}`}>{item}</span>
                      <Badge variant="outline" className="ml-auto text-xs capitalize">{status}</Badge>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Tap to cycle: Pending → Shortlisted → Booked</p>
            </CardContent>
          </Card>
        )}

        {/* Inquiry Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inquiry Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {inquiryStats.total > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{inquiryStats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5">
                    <p className="text-lg font-bold text-primary">{inquiryStats.accepted}</p>
                    <p className="text-xs text-muted-foreground">Accepted</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/5">
                    <p className="text-lg font-bold text-destructive">{inquiryStats.rejected}</p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/marketplace/inquiries')}>
                  View All Inquiries <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No inquiries sent yet</p>
                <Button size="sm" onClick={() => navigate(`/marketplace/events/${event.id}/vendors`)}>
                  Find Vendors <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Button className="w-full" size="lg" onClick={() => navigate(`/marketplace/events/${event.id}/vendors`)}>
        <Search className="h-4 w-4 mr-2" /> Find & Compare Vendors
      </Button>
    </div>
  );
};

export default EventPlannerDashboard;

/**
 * UserEvents page — enhanced with Event Planner Dashboard.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { CITIES, EVENT_TYPES, EVENT_TYPE_EMOJI } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, IndianRupee, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import EventPlannerDashboard from "@/components/marketplace/user/EventPlannerDashboard";
import { AppLayout } from "@/components/layout/AppLayout";

const UserEvents = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['user-all-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('events')
        .select(`*, event_services (service_id, services (id, name))`)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: eventInquiries } = useQuery({
    queryKey: ['event-inquiries-planner', expandedEventId, user?.id],
    queryFn: async () => {
      if (!user || !expandedEventId) return [];
      const { data, error } = await supabase
        .from('inquiries')
        .select('id, vendor_id, status')
        .eq('event_id', expandedEventId)
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!expandedEventId && !!user,
  });

  const getCityLabel = (cityValue: string) => CITIES.find(c => c.value === cityValue)?.label || cityValue;
  const getEventTypeLabel = (typeValue: string) => EVENT_TYPES.find(t => t.value === typeValue)?.label || typeValue;

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-1">Events</p>
            <h1 className="text-2xl font-bold">My Events</h1>
          </div>
          <Button onClick={() => navigate('/marketplace/events/create')}>
            <Plus className="h-4 w-4 mr-2" />Create Event
          </Button>
        </div>

        {events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event: any) => {
              const isExpanded = expandedEventId === event.id;
              return (
                <div key={event.id}>
                  <Card className="hover-lift">
                    <CardHeader className="pb-2 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{EVENT_TYPE_EMOJI[event.event_type] || '🎉'}</span>
                          <div>
                            <CardTitle className="text-base">{event.title}</CardTitle>
                            <CardDescription className="text-xs">{getEventTypeLabel(event.event_type || '')}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={event.status === 'active' ? 'default' : 'secondary'} className="text-xs">{event.status}</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedEventId(isExpanded ? null : event.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {getCityLabel(event.city || '')}
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3.5 w-3.5" />
                          ₹{event.budget_min?.toLocaleString()} - ₹{event.budget_max?.toLocaleString()}
                        </div>
                      </div>

                      {event.event_services && event.event_services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {event.event_services.map((es: any) => (
                            <Badge key={es.service_id} variant="outline" className="text-xs">{es.services?.name}</Badge>
                          ))}
                        </div>
                      )}

                      {!isExpanded && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => setExpandedEventId(event.id)}>
                            View Planner
                          </Button>
                          <Button size="sm" className="flex-1 text-xs h-8" onClick={() => navigate(`/marketplace/events/${event.id}/vendors`)}>
                            <Search className="h-3.5 w-3.5 mr-1" />Find Vendors
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {isExpanded && (
                    <div className="mt-3 ml-0 md:ml-4">
                      <EventPlannerDashboard
                        event={event}
                        eventServices={event.event_services || []}
                        inquiries={eventInquiries || []}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-accent mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">No events yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first event to start finding vendors</p>
              <Button onClick={() => navigate('/marketplace/events/create')}>
                <Plus className="h-4 w-4 mr-2" />Create Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default UserEvents;

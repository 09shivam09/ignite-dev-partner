/**
 * UserEvents page — enhanced with Event Planner Dashboard.
 * Each event card can expand into a full planning view.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { CITIES, EVENT_TYPES, EVENT_TYPE_EMOJI } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Calendar, MapPin, IndianRupee, Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import EventPlannerDashboard from "@/components/marketplace/user/EventPlannerDashboard";

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

  // Fetch inquiries for expanded event
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Home
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Events</h1>
          <Button onClick={() => navigate('/marketplace/events/create')}>
            <Plus className="h-4 w-4 mr-2" />Create Event
          </Button>
        </div>

        {events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event: any) => {
              const isExpanded = expandedEventId === event.id;
              return (
                <div key={event.id} className="space-y-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{EVENT_TYPE_EMOJI[event.event_type] || '🎉'}</span>
                          <div>
                            <CardTitle>{event.title}</CardTitle>
                            <CardDescription>{getEventTypeLabel(event.event_type || '')}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>{event.status}</Badge>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedEventId(isExpanded ? null : event.id)}>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {getCityLabel(event.city || '')}
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" />
                          ₹{event.budget_min?.toLocaleString()} - ₹{event.budget_max?.toLocaleString()}
                        </div>
                      </div>

                      {event.event_services && event.event_services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {event.event_services.map((es: any) => (
                            <Badge key={es.service_id} variant="outline">{es.services?.name}</Badge>
                          ))}
                        </div>
                      )}

                      {!isExpanded && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setExpandedEventId(event.id)}>
                            View Planner
                          </Button>
                          <Button size="sm" className="flex-1" onClick={() => navigate(`/marketplace/events/${event.id}/vendors`)}>
                            <Search className="h-4 w-4 mr-2" />Find Vendors
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Expanded Planner Dashboard */}
                  {isExpanded && (
                    <div className="mt-4 pl-0 md:pl-4">
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
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No events yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first event to start finding vendors</p>
              <Button onClick={() => navigate('/marketplace/events/create')}>
                <Plus className="h-4 w-4 mr-2" />Create Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserEvents;

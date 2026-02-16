import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { EVENT_TYPES, getEventTypeLabel, getInquiryStatusVariant, capitalizeFirst, EVENT_TYPE_EMOJI } from "@/lib/constants";
import { Loader2, Plus, Calendar, Search, LogOut, Heart, MessageSquare, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Event, InquiryWithRelations } from "@/types/marketplace";

const UserHome = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();

  // Fetch user's events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: async (): Promise<Event[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('events').select('*').eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Event[];
    },
    enabled: !!user,
  });

  // Fetch user's inquiries
  const { data: inquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['user-inquiries', user?.id],
    queryFn: async (): Promise<InquiryWithRelations[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('inquiries')
        .select(`*, vendors (id, business_name, city), events (id, title, event_type)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as InquiryWithRelations[];
    },
    enabled: !!user,
  });

  // Fetch saved vendors count
  const { data: savedVendors } = useQuery({
    queryKey: ['saved-vendors-summary', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_vendors')
        .select(`id, vendor_id, vendors (id, business_name, city)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Inquiry stats
  const inquiryStats = {
    total: inquiries?.length || 0,
    pending: inquiries?.filter(i => i.status === 'pending').length || 0,
    accepted: inquiries?.filter(i => i.status === 'accepted').length || 0,
    rejected: inquiries?.filter(i => i.status === 'rejected').length || 0,
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/marketplace/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">🎉 EventConnect</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Hi, {profile?.full_name || 'User'}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Plan Your Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/marketplace/events/create')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Create New Event</h3>
                  <p className="text-sm text-muted-foreground">Start planning your celebration</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/marketplace/vendors')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-accent/10">
                  <Search className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Browse Vendors</h3>
                  <p className="text-sm text-muted-foreground">Find vendors for your event</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/marketplace/saved')}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-destructive/10">
                  <Heart className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold">Saved Vendors</h3>
                  <p className="text-sm text-muted-foreground">{savedVendors?.length || 0} vendors saved</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Dashboard Overview Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{events?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{inquiryStats.total}</p>
              <p className="text-sm text-muted-foreground">Inquiries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{inquiryStats.accepted}</p>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{inquiryStats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </section>

        {/* Event Types */}
        <section>
          <h2 className="text-xl font-bold mb-4">Event Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {EVENT_TYPES.map((eventType) => (
              <Card 
                key={eventType.value}
                className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                onClick={() => navigate(`/marketplace/events/create?type=${eventType.value}`)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{EVENT_TYPE_EMOJI[eventType.value] || '🎉'}</div>
                  <p className="text-sm font-medium">{eventType.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* My Events */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Events</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/marketplace/events')}>View All</Button>
          </div>
          {eventsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 3).map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <CardDescription>{getEventTypeLabel(event.event_type || '')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/marketplace/events/${event.id}/vendors`)}>
                      Find Vendors
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
        </section>

        {/* Recent Inquiries */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Inquiries</h2>
            <Button variant="outline" size="sm" onClick={() => navigate('/marketplace/inquiries')}>View All</Button>
          </div>
          {inquiriesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : inquiries && inquiries.length > 0 ? (
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{inquiry.vendors?.business_name}</p>
                      <p className="text-sm text-muted-foreground">For: {inquiry.events?.title}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      inquiry.status === 'accepted' ? 'bg-primary/10 text-primary' :
                      inquiry.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>{capitalizeFirst(inquiry.status)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No inquiries yet. Create an event and find vendors!</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Saved Vendors */}
        {savedVendors && savedVendors.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Saved Vendors</h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/marketplace/saved')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVendors.slice(0, 3).map((sv: any) => (
                <Card key={sv.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/marketplace/vendor/${sv.vendor_id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      <span className="font-medium">{sv.vendors?.business_name}</span>
                    </div>
                    {sv.vendors?.city && (
                      <p className="text-sm text-muted-foreground mt-1">{sv.vendors.city}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default UserHome;

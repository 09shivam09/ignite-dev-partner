import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { EVENT_TYPES, getEventTypeLabel, capitalizeFirst, EVENT_TYPE_EMOJI } from "@/lib/constants";
import { Plus, Calendar, Search, Heart, MessageSquare, ArrowRight, ClipboardList, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import type { Event, InquiryWithRelations } from "@/types/marketplace";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const UserHome = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

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

  const inquiryStats = {
    total: inquiries?.length || 0,
    pending: inquiries?.filter(i => i.status === 'pending').length || 0,
    accepted: inquiries?.filter(i => i.status === 'accepted').length || 0,
    rejected: inquiries?.filter(i => i.status === 'rejected').length || 0,
  };

  const planningProgress = events && events.length > 0 && inquiryStats.total > 0
    ? Math.min(100, Math.round((inquiryStats.accepted / Math.max(1, events.length)) * 100 + (inquiryStats.total > 0 ? 20 : 0)))
    : 0;

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-6xl mx-auto space-y-8">
        {/* Welcome header */}
        <motion.div {...fadeIn}>
          <p className="section-label mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold">
            Welcome, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground mt-1">Plan, discover, and manage your events</p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Events", value: events?.length || 0, color: "text-foreground" },
              { label: "Inquiries", value: inquiryStats.total, color: "text-foreground" },
              { label: "Accepted", value: inquiryStats.accepted, color: "text-primary" },
              { label: "Pending", value: inquiryStats.pending, color: "text-muted-foreground" },
            ].map((stat) => (
              <Card key={stat.label} className="hover-scale">
                <CardContent className="p-5 text-center">
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Planning progress */}
        {planningProgress > 0 && (
          <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Planning Progress</p>
                    <p className="text-sm font-semibold text-primary">{planningProgress}%</p>
                  </div>
                  <Progress value={planningProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.section {...fadeIn} transition={{ delay: 0.2 }}>
          <p className="section-label mb-3">Quick Actions</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover-lift cursor-pointer group" onClick={() => navigate('/marketplace/events/create')}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Create Event</h3>
                  <p className="text-xs text-muted-foreground">Start planning</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift cursor-pointer group" onClick={() => navigate('/marketplace/vendors')}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 rounded-xl bg-accent group-hover:bg-primary/10 transition-colors">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Browse Vendors</h3>
                  <p className="text-xs text-muted-foreground">Find the best match</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-lift cursor-pointer group" onClick={() => navigate('/marketplace/saved')}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 rounded-xl bg-love/10 group-hover:bg-love/15 transition-colors">
                  <Heart className="h-5 w-5 text-love" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Saved Vendors</h3>
                  <p className="text-xs text-muted-foreground">{savedVendors?.length || 0} saved</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Event Types */}
        <motion.section {...fadeIn} transition={{ delay: 0.25 }}>
          <p className="section-label mb-3">Event Types</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {EVENT_TYPES.map((eventType) => (
              <Card
                key={eventType.value}
                className="hover-scale cursor-pointer"
                onClick={() => navigate(`/marketplace/events/create?type=${eventType.value}`)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1.5">{EVENT_TYPE_EMOJI[eventType.value] || '🎉'}</div>
                  <p className="text-xs font-medium">{eventType.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* My Events */}
        <motion.section {...fadeIn} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">My Events</p>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/marketplace/events')}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 3).map((event) => (
                <Card key={event.id} className="hover-lift">
                  <CardHeader className="pb-2 p-5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{EVENT_TYPE_EMOJI[event.event_type || ''] || '🎉'}</span>
                      <CardTitle className="text-base">{event.title}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">{getEventTypeLabel(event.event_type || '')}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Calendar className="h-3.5 w-3.5" />
                      {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => navigate('/marketplace/events')}>
                        <ClipboardList className="h-3.5 w-3.5 mr-1" />Plan
                      </Button>
                      <Button size="sm" className="flex-1 text-xs h-8" onClick={() => navigate(`/marketplace/events/${event.id}/vendors`)}>
                        Find Vendors
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-accent mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">No events yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first event to start</p>
                <Button onClick={() => navigate('/marketplace/events/create')}>
                  <Plus className="h-4 w-4 mr-2" />Create Event
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {/* Recent Inquiries */}
        <motion.section {...fadeIn} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Recent Inquiries</p>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/marketplace/inquiries')}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {inquiriesLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : inquiries && inquiries.length > 0 ? (
            <div className="space-y-2">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id} className="hover-lift cursor-pointer"
                  onClick={() => navigate('/marketplace/inquiries')}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-sm">{inquiry.vendors?.business_name}</p>
                      <p className="text-xs text-muted-foreground">For: {inquiry.events?.title}</p>
                    </div>
                    <Badge
                      variant={inquiry.status === 'accepted' ? 'default' : inquiry.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {capitalizeFirst(inquiry.status)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No inquiries yet</p>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {/* Saved Vendors */}
        {savedVendors && savedVendors.length > 0 && (
          <motion.section {...fadeIn} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Saved Vendors</p>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/marketplace/saved')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {savedVendors.slice(0, 3).map((sv: any) => (
                <Card key={sv.id} className="hover-lift cursor-pointer"
                  onClick={() => navigate(`/marketplace/vendor/${sv.vendor_id}`)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Heart className="h-4 w-4 fill-current text-love flex-shrink-0" />
                    <div>
                      <span className="font-medium text-sm">{sv.vendors?.business_name}</span>
                      {sv.vendors?.city && (
                        <p className="text-xs text-muted-foreground">{sv.vendors.city}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </AppLayout>
  );
};

export default UserHome;

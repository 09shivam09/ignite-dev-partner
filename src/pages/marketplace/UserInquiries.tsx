import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, MessageSquare, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { UserInquiryCard } from "@/components/marketplace/InquiryCard";
import { EVENT_TYPES, capitalizeFirst } from "@/lib/constants";
import type { InquiryWithRelations } from "@/types/marketplace";

const ITEMS_PER_PAGE = 10;

const UserInquiries = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: inquiries, isLoading, error } = useQuery({
    queryKey: ['user-all-inquiries', user?.id],
    queryFn: async (): Promise<InquiryWithRelations[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('inquiries')
        .select(`*, vendors (id, business_name, city, business_phone), events (id, title, event_type, event_date)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as InquiryWithRelations[];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (!inquiries) return [];
    let result = [...inquiries];
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter);
    if (eventTypeFilter !== 'all') result = result.filter(i => i.events?.event_type === eventTypeFilter);
    return result;
  }, [inquiries, statusFilter, eventTypeFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stats
  const stats = useMemo(() => ({
    total: inquiries?.length || 0,
    pending: inquiries?.filter(i => i.status === 'pending').length || 0,
    accepted: inquiries?.filter(i => i.status === 'accepted').length || 0,
    rejected: inquiries?.filter(i => i.status === 'rejected').length || 0,
  }), [inquiries]);

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Home
          </Button>
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="font-semibold mb-2">Error loading inquiries</h3>
              <p className="text-sm text-muted-foreground mb-4">{error instanceof Error ? error.message : 'Something went wrong'}</p>
              <Button onClick={() => navigate('/marketplace')}>Return Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Home
        </Button>

        <h1 className="text-2xl font-bold mb-4">My Inquiries</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-primary">{stats.accepted}</p><p className="text-xs text-muted-foreground">Accepted</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-lg font-bold text-destructive">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-40 h-9"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={eventTypeFilter} onValueChange={(v) => { setEventTypeFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Event Types</SelectItem>
              {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto self-center">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {paginated.length > 0 ? (
          <div className="space-y-4">
            {paginated.map((inquiry) => (
              <UserInquiryCard key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No inquiries found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter !== 'all' || eventTypeFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create an event and send inquiries to vendors'}
              </p>
              {statusFilter === 'all' && eventTypeFilter === 'all' && (
                <Button onClick={() => navigate('/marketplace/events/create')}>Create Event</Button>
              )}
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInquiries;

import { useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCityLabel, formatPriceRange, getEventTypeLabel } from "@/lib/constants";
import { calculateMatchScore } from "@/lib/budget-intelligence";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, ArrowLeft, MapPin, Star, Send, Check, Search, 
  Heart, Filter, ArrowUpDown, GitCompareArrows, X, ChevronLeft, ChevronRight,
  Clock, Zap, Shield, CheckSquare
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";
import VendorMatchCard from "@/components/marketplace/user/VendorMatchCard";
import BudgetRangeSlider from "@/components/marketplace/user/BudgetRangeSlider";
import VendorLifecycleSelect from "@/components/marketplace/user/VendorLifecycleSelect";
import BulkInquiryBar from "@/components/marketplace/user/BulkInquiryBar";
import type { VendorCardData } from "@/components/marketplace/user/VendorMatchCard";
import type { MatchedVendor, MatchedService, Event, VendorService } from "@/types/marketplace";

const VENDORS_PER_PAGE = 10;

const VendorDiscovery = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedVendor, setSelectedVendor] = useState<VendorCardData | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInquiries, setSentInquiries] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("match");
  const [filterService, setFilterService] = useState<string>("all");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [budgetFilter, setBudgetFilter] = useState<[number, number] | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [lifecycleRefreshKey, setLifecycleRefreshKey] = useState(0);
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', eventId!).maybeSingle();
      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!eventId,
  });

  const { data: eventServices } = useQuery({
    queryKey: ['event-services', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_services').select(`service_id, services (id, name)`).eq('event_id', eventId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const { data: existingInquiries } = useQuery({
    queryKey: ['event-inquiries', eventId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('inquiries').select('vendor_id').eq('event_id', eventId!).eq('user_id', user.id);
      if (error) throw error;
      return data?.map(i => i.vendor_id) || [];
    },
    enabled: !!eventId && !!user,
  });

  const { data: savedVendorIds } = useQuery({
    queryKey: ['saved-vendors', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_vendors').select('vendor_id').eq('user_id', user.id);
      if (error) throw error;
      return data?.map(s => s.vendor_id) || [];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      if (!user) throw new Error("Not authenticated");
      const isSaved = savedVendorIds?.includes(vendorId);
      if (isSaved) {
        const { error } = await supabase.from('saved_vendors').delete().eq('user_id', user.id).eq('vendor_id', vendorId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saved_vendors').insert({ user_id: user.id, vendor_id: vendorId });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['saved-vendors'] }); },
  });

  const { data: vendorCards, isLoading: vendorsLoading } = useQuery({
    queryKey: ['matched-vendors-scored', eventId, event?.city, event?.budget_min, event?.budget_max, event?.event_type, eventServices],
    queryFn: async (): Promise<VendorCardData[]> => {
      if (!event || !eventServices || eventServices.length === 0) return [];
      const requiredServiceIds = eventServices.map((es) => es.service_id);

      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select(`id, business_name, business_description, city, rating, total_reviews,
          supported_event_types, response_time_hours, verification_status, updated_at,
          vendor_services (id, name, service_id, price_min, price_max, base_price, is_available)`)
        .eq('city', event.city)
        .eq('is_active', true);

      if (vendorsError) throw vendorsError;
      if (!vendors) return [];

      const cards: VendorCardData[] = [];
      for (const vendor of vendors) {
        const vendorEventTypes = (vendor as any).supported_event_types as string[] | null;
        if (event.event_type && vendorEventTypes && vendorEventTypes.length > 0 && !vendorEventTypes.includes(event.event_type)) continue;
        const eventTypeMatch = !event.event_type || !vendorEventTypes || vendorEventTypes.length === 0 || vendorEventTypes.includes(event.event_type);

        const vendorSvcs = vendor.vendor_services as VendorService[] | null;
        const vendorServiceIds = vendorSvcs?.filter((vs) => vs.is_available && vs.service_id).map((vs) => vs.service_id) || [];
        const hasRequiredService = requiredServiceIds.some((reqId: string) => vendorServiceIds.includes(reqId));
        if (!hasRequiredService) continue;

        const matchingServices = vendorSvcs?.filter((vs) => vs.is_available && requiredServiceIds.includes(vs.service_id || '')) || [];
        let priceOverlaps = false;
        const matchedServices: MatchedService[] = [];

        // Collect all matching services — budget check is done on aggregate, not per-service,
        // because event budget is the TOTAL budget, not per-service budget.
        for (const vs of matchingServices) {
          const priceMin = vs.price_min || vs.base_price || 0;
          const priceMax = vs.price_max || vs.base_price || 0;
          const normalizedMin = Math.min(priceMin, priceMax);
          const normalizedMax = Math.max(priceMin, priceMax);
          matchedServices.push({ name: vs.name, price_min: normalizedMin, price_max: normalizedMax });
        }
        if (matchedServices.length === 0) continue;

        // Aggregate vendor total price range across matched services
        const aggregateMin = matchedServices.reduce((sum, s) => sum + s.price_min, 0);
        const aggregateMax = matchedServices.reduce((sum, s) => sum + s.price_max, 0);
        // A vendor is budget-compatible if their cheapest possible total is within the event max budget
        // Individual services are typically a fraction of the total event budget, so we check
        // that at least the minimum service price fits within the budget ceiling
        priceOverlaps = aggregateMin <= (event.budget_max || Infinity);

        const vendorMinPrice = Math.min(...matchedServices.map(s => s.price_min));
        const vendorMaxPrice = Math.max(...matchedServices.map(s => s.price_max));
        const overlapStart = Math.max(vendorMinPrice, event.budget_min || 0);
        const overlapEnd = Math.min(vendorMaxPrice, event.budget_max || Infinity);
        const overlapRange = Math.max(0, overlapEnd - overlapStart);
        const totalRange = (event.budget_max || 0) - (event.budget_min || 0);
        const budgetOverlapPercent = totalRange > 0 ? Math.min(100, (overlapRange / totalRange) * 100) : 80;
        const serviceMatchPercent = (matchedServices.length / requiredServiceIds.length) * 100;

        const matchScore = calculateMatchScore({
          eventTypeMatch,
          budgetOverlapPercent,
          serviceMatchPercent,
          responseTimeHours: vendor.response_time_hours,
          isAvailable: true,
        });

        const lastActive = vendor.updated_at ? new Date(vendor.updated_at) : null;
        let lastActiveLabel = 'Recently active';
        if (lastActive) {
          const diffDays = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) lastActiveLabel = 'Active today';
          else if (diffDays <= 3) lastActiveLabel = `Active ${diffDays}d ago`;
          else if (diffDays <= 7) lastActiveLabel = 'Active this week';
          else lastActiveLabel = `Active ${diffDays}d ago`;
        }

        cards.push({
          id: vendor.id,
          business_name: vendor.business_name,
          business_description: vendor.business_description,
          city: vendor.city || '',
          rating: vendor.rating,
          total_reviews: vendor.total_reviews,
          matchedServices,
          matchScore,
          responseTimeHours: vendor.response_time_hours,
          verificationStatus: vendor.verification_status,
          lastActiveLabel,
          acceptanceRate: null,
        });
      }
      return cards;
    },
    enabled: !!event && !!eventServices && eventServices.length > 0,
  });

  const filteredAndSorted = useMemo(() => {
    if (!vendorCards) return [];
    let result = [...vendorCards];
    if (filterService !== 'all') {
      result = result.filter(v => v.matchedServices.some(s => s.name.toLowerCase().includes(filterService.toLowerCase())));
    }
    switch (sortBy) {
      case 'match': result.sort((a, b) => b.matchScore.score - a.matchScore.score); break;
      case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'price-low': result.sort((a, b) => Math.min(...a.matchedServices.map(s => s.price_min)) - Math.min(...b.matchedServices.map(s => s.price_min))); break;
      case 'price-high': result.sort((a, b) => Math.max(...b.matchedServices.map(s => s.price_max)) - Math.max(...a.matchedServices.map(s => s.price_max))); break;
      case 'services': result.sort((a, b) => b.matchedServices.length - a.matchedServices.length); break;
      default: result.sort((a, b) => b.matchScore.score - a.matchScore.score);
    }
    return result;
  }, [vendorCards, filterService, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / VENDORS_PER_PAGE);
  const paginatedVendors = filteredAndSorted.slice((currentPage - 1) * VENDORS_PER_PAGE, currentPage * VENDORS_PER_PAGE);

  const serviceNames = useMemo(() => {
    if (!vendorCards) return [];
    const names = new Set<string>();
    vendorCards.forEach(v => v.matchedServices.forEach(s => names.add(s.name)));
    return Array.from(names);
  }, [vendorCards]);

  const compareVendors = useMemo(() => {
    if (!vendorCards) return [];
    return vendorCards.filter(v => compareIds.has(v.id));
  }, [vendorCards, compareIds]);

  const toggleCompare = (vendorId: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) { next.delete(vendorId); }
      else if (next.size < 3) { next.add(vendorId); }
      else { toast({ title: "Limit reached", description: "Compare up to 3 vendors", variant: "destructive" }); }
      return next;
    });
  };

  const handleSendInquiry = async () => {
    if (!selectedVendor || !user || !eventId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('inquiries').insert({
        event_id: eventId, vendor_id: selectedVendor.id, user_id: user.id,
        message: inquiryMessage || null, status: 'pending',
      });
      if (error) throw error;
      setSentInquiries(prev => new Set([...prev, selectedVendor.id]));
      toast({ title: "Inquiry sent!", description: `Sent to ${selectedVendor.business_name}` });
      setSelectedVendor(null); setInquiryMessage("");
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : 'Failed', variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const isInquirySent = (vendorId: string) => sentInquiries.has(vendorId) || existingInquiries?.includes(vendorId);

  const toggleBulkSelect = useCallback((vendorId: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) next.delete(vendorId);
      else next.add(vendorId);
      return next;
    });
  }, []);

  const handleBulkInquiry = useCallback(async () => {
    if (!user || !eventId || bulkSelected.size === 0) return;
    setIsBulkSending(true);
    try {
      const vendorIds = Array.from(bulkSelected).filter(id => !isInquirySent(id));
      if (vendorIds.length === 0) {
        toast({ title: "Already sent", description: "Inquiries already sent to all selected vendors." });
        setBulkSelected(new Set());
        return;
      }
      const inserts = vendorIds.map(vendor_id => ({
        event_id: eventId, vendor_id, user_id: user.id,
        message: null, status: 'pending',
      }));
      const { error } = await supabase.from('inquiries').insert(inserts);
      if (error) throw error;
      setSentInquiries(prev => new Set([...prev, ...vendorIds]));
      toast({ title: "Inquiries sent!", description: `Sent to ${vendorIds.length} vendor${vendorIds.length > 1 ? 's' : ''}.` });
      setBulkSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['event-inquiries'] });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : 'Failed', variant: "destructive" });
    } finally { setIsBulkSending(false); }
  }, [user, eventId, bulkSelected, sentInquiries, existingInquiries, toast, queryClient]);
  if (!eventId) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto">
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-accent mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Browse Vendors</h2>
              <p className="text-muted-foreground text-sm max-w-md mb-6">To see matching vendors, create an event first.</p>
              <Button size="lg" onClick={() => navigate('/marketplace/events/create')}>Create an Event</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (eventLoading || vendorsLoading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-20 w-full" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </AppLayout>
    );
  }

  if (eventError || !event) {
    return (
      <AppLayout>
        <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto">
          <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="font-semibold mb-2">Event not found</h3>
              <Button onClick={() => navigate('/marketplace/events/create')}>Create New Event</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" className="text-xs -ml-2" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
        </Button>

        {/* Event Summary */}
        <Card>
          <CardHeader className="pb-2 p-5">
            <CardTitle className="text-base">{event.title}</CardTitle>
            <CardDescription className="text-xs">
              {getEventTypeLabel(event.event_type || '')} · {getCityLabel(event.city || '')} · {formatPriceRange(event.budget_min, event.budget_max)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="flex flex-wrap gap-1.5">
              {eventServices?.map((es) => (
                <Badge key={es.service_id} variant="secondary" className="text-xs">{(es as any).services?.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-3.5 w-3.5 mr-1" />Filters
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <ArrowUpDown className="h-3 w-3 mr-1" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low → High</SelectItem>
              <SelectItem value="price-high">Price: High → Low</SelectItem>
              <SelectItem value="services">Most Services</SelectItem>
            </SelectContent>
          </Select>
          {compareIds.size > 0 && (
            <Button size="sm" variant="secondary" className="text-xs h-8" onClick={() => setShowCompare(true)}>
              <GitCompareArrows className="h-3.5 w-3.5 mr-1" />Compare ({compareIds.size})
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{filteredAndSorted.length} vendor{filteredAndSorted.length !== 1 ? 's' : ''}</span>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Filter by Service</Label>
                <Select value={filterService} onValueChange={(v) => { setFilterService(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-48 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {event && (
                <div>
                  <Label className="text-xs text-muted-foreground">Budget Range Filter</Label>
                  <div className="mt-2">
                    <BudgetRangeSlider
                      eventType={event.event_type || undefined}
                      value={budgetFilter || [event.budget_min || 0, event.budget_max || 500000]}
                      onChange={(val) => { setBudgetFilter(val); setCurrentPage(1); }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {paginatedVendors.length > 0 ? (
          <div className="space-y-3">
            {paginatedVendors.map((vendor) => (
              <div key={vendor.id} className="relative">
                {/* Bulk select checkbox + lifecycle tracker */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  {eventId && (
                    <VendorLifecycleSelect
                      eventId={eventId}
                      vendorId={vendor.id}
                      vendorName={vendor.business_name}
                      compact
                      onStatusChange={() => setLifecycleRefreshKey(k => k + 1)}
                    />
                  )}
                  {!isInquirySent(vendor.id) && (
                    <Checkbox
                      checked={bulkSelected.has(vendor.id)}
                      onCheckedChange={() => toggleBulkSelect(vendor.id)}
                      aria-label={`Select ${vendor.business_name} for bulk inquiry`}
                    />
                  )}
                </div>
                <VendorMatchCard
                  vendor={vendor}
                  isInquirySent={isInquirySent(vendor.id) || false}
                  isSaved={savedVendorIds?.includes(vendor.id) || false}
                  isComparing={compareIds.has(vendor.id)}
                  onSendInquiry={() => setSelectedVendor(vendor)}
                  onToggleSave={() => saveMutation.mutate(vendor.id)}
                  onToggleCompare={() => toggleCompare(vendor.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="font-semibold mb-2">No matching vendors found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your budget range or check back later.</p>
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Comparison Dialog */}
        <Dialog open={showCompare} onOpenChange={setShowCompare}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Compare Vendors ({compareVendors.length})</DialogTitle></DialogHeader>
            {compareVendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {compareVendors.map((v) => (
                  <Card key={v.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{v.business_name}</h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleCompare(v.id)}><X className="h-3 w-3" /></Button>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-primary/5">
                        <p className="text-2xl font-bold text-primary">{v.matchScore.score}%</p>
                        <p className="text-xs text-muted-foreground">Match Score</p>
                      </div>
                      <div className="text-xs text-muted-foreground"><MapPin className="h-3 w-3 inline mr-1" />{getCityLabel(v.city)}</div>
                      {v.rating && v.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3 fill-gold text-gold" />{Number(v.rating).toFixed(1)} ({v.total_reviews})
                        </div>
                      )}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {v.responseTimeHours !== null && (
                          <p className="flex items-center gap-1"><Clock className="h-3 w-3" />
                            {v.responseTimeHours <= 4 ? '<4h' : v.responseTimeHours <= 12 ? '<12h' : `${v.responseTimeHours}h`} response
                          </p>
                        )}
                        {v.verificationStatus === 'verified' && (
                          <p className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" />Verified</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Services:</p>
                        {v.matchedServices.map((s, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span>{s.name}</span>
                            <span className="text-muted-foreground">{formatPriceRange(s.price_min, s.price_max)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t">
                        {!isInquirySent(v.id) ? (
                          <Button size="sm" className="w-full text-xs" onClick={() => { setSelectedVendor(v); setShowCompare(false); }}>
                            <Send className="h-3 w-3 mr-1" />Inquire
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="w-full justify-center text-xs">Sent</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Select vendors to compare</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Inquiry Dialog */}
        <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Inquiry to {selectedVendor?.business_name}</DialogTitle>
              <DialogDescription>The vendor will receive your event details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea placeholder="Add any specific requirements..." value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedVendor(null)}>Cancel</Button>
              <Button onClick={handleSendInquiry} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send Inquiry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Inquiry Floating Bar */}
        <BulkInquiryBar
          selectedCount={bulkSelected.size}
          onSendAll={handleBulkInquiry}
          onClear={() => setBulkSelected(new Set())}
          isSending={isBulkSending}
        />
      </div>
    </AppLayout>
  );
};

export default VendorDiscovery;

import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCityLabel, formatPriceRange, getEventTypeLabel } from "@/lib/constants";
import { calculateMatchScore } from "@/lib/budget-intelligence";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, ArrowLeft, MapPin, Star, Send, Check, Search, 
  Heart, Filter, ArrowUpDown, GitCompareArrows, X, ChevronLeft, ChevronRight,
  Clock, Zap, Shield
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import VendorMatchCard from "@/components/marketplace/user/VendorMatchCard";
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

  // Fetch vendors with extended data for match scoring
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
        const eventTypeMatch = !event.event_type || !vendorEventTypes || vendorEventTypes.length === 0 || vendorEventTypes.includes(event.event_type);
        if (event.event_type && vendorEventTypes && vendorEventTypes.length > 0 && !vendorEventTypes.includes(event.event_type)) continue;

        const vendorSvcs = vendor.vendor_services as VendorService[] | null;
        const vendorServiceIds = vendorSvcs?.filter((vs) => vs.is_available && vs.service_id).map((vs) => vs.service_id) || [];
        const hasRequiredService = requiredServiceIds.some((reqId: string) => vendorServiceIds.includes(reqId));
        if (!hasRequiredService) continue;

        const matchingServices = vendorSvcs?.filter((vs) => vs.is_available && requiredServiceIds.includes(vs.service_id || '')) || [];
        let priceOverlaps = false;
        const matchedServices: MatchedService[] = [];

        for (const vs of matchingServices) {
          const priceMin = vs.price_min || vs.base_price || 0;
          const priceMax = vs.price_max || vs.base_price || 0;
          const normalizedMin = Math.min(priceMin, priceMax);
          const normalizedMax = Math.max(priceMin, priceMax);
          if (normalizedMin <= (event.budget_max || Infinity) && normalizedMax >= (event.budget_min || 0)) {
            priceOverlaps = true;
            matchedServices.push({ name: vs.name, price_min: normalizedMin, price_max: normalizedMax });
          }
        }
        if (!priceOverlaps) continue;

        // Calculate budget overlap percentage
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

        // Last active label
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
          acceptanceRate: null, // would need aggregate query — null is safe fallback
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

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Home
          </Button>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-16 w-16 text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-3">Browse Vendors</h2>
              <p className="text-muted-foreground max-w-md mb-6">To see matching vendors, create an event first.</p>
              <Button size="lg" onClick={() => navigate('/marketplace/events/create')}>Create an Event</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (eventLoading || vendorsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="font-semibold mb-2">Event not found</h3>
              <Button onClick={() => navigate('/marketplace/events/create')}>Create New Event</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Home
        </Button>

        {/* Event Summary */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>
              {getEventTypeLabel(event.event_type || '')} • {getCityLabel(event.city || '')} • Budget: {formatPriceRange(event.budget_min, event.budget_max)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {eventServices?.map((es) => (
                <Badge key={es.service_id} variant="secondary">{(es as any).services?.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1" />Filters
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 h-9">
              <ArrowUpDown className="h-3 w-3 mr-1" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="services">Most Services</SelectItem>
            </SelectContent>
          </Select>
          {compareIds.size > 0 && (
            <Button size="sm" variant="secondary" onClick={() => setShowCompare(true)}>
              <GitCompareArrows className="h-4 w-4 mr-1" />Compare ({compareIds.size})
            </Button>
          )}
          <span className="text-sm text-muted-foreground ml-auto">{filteredAndSorted.length} vendor{filteredAndSorted.length !== 1 ? 's' : ''}</span>
        </div>

        {showFilters && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="space-y-1">
                <Label className="text-xs">Filter by Service</Label>
                <Select value={filterService} onValueChange={(v) => { setFilterService(v); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-bold mb-4">Matching Vendors ({filteredAndSorted.length})</h2>

        {paginatedVendors.length > 0 ? (
          <div className="space-y-4">
            {paginatedVendors.map((vendor) => (
              <VendorMatchCard
                key={vendor.id}
                vendor={vendor}
                isInquirySent={isInquirySent(vendor.id) || false}
                isSaved={savedVendorIds?.includes(vendor.id) || false}
                isComparing={compareIds.has(vendor.id)}
                onSendInquiry={() => setSelectedVendor(vendor)}
                onToggleSave={() => saveMutation.mutate(vendor.id)}
                onToggleCompare={() => toggleCompare(vendor.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold mb-2">No matching vendors found</h3>
              <p className="text-sm text-muted-foreground max-w-md">Try adjusting your budget range or check back later.</p>
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

        {/* Enhanced Comparison Dialog */}
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
                        <Button variant="ghost" size="sm" onClick={() => toggleCompare(v.id)}><X className="h-3 w-3" /></Button>
                      </div>
                      
                      {/* Match Score */}
                      <div className="text-center p-2 rounded-lg bg-primary/5">
                        <p className="text-2xl font-bold text-primary">{v.matchScore.score}%</p>
                        <p className="text-xs text-muted-foreground">Match Score</p>
                      </div>

                      <div className="text-sm text-muted-foreground"><MapPin className="h-3 w-3 inline mr-1" />{getCityLabel(v.city)}</div>
                      {v.rating && v.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{Number(v.rating).toFixed(1)} ({v.total_reviews})
                        </div>
                      )}

                      {/* Activity */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {v.responseTimeHours !== null && (
                          <p className="flex items-center gap-1"><Clock className="h-3 w-3" />
                            {v.responseTimeHours <= 4 ? '<4h response' : v.responseTimeHours <= 12 ? '<12h response' : `${v.responseTimeHours}h response`}
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
                          <Button size="sm" className="w-full" onClick={() => { setSelectedVendor(v); setShowCompare(false); }}>
                            <Send className="h-3 w-3 mr-1" />Inquire
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="w-full justify-center">Sent</Badge>
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
      </div>
    </div>
  );
};

export default VendorDiscovery;

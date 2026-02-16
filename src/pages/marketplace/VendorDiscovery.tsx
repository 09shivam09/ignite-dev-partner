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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader2, ArrowLeft, MapPin, Star, Send, Check, Search, 
  Heart, Filter, ArrowUpDown, GitCompareArrows, X, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { MatchedVendor, MatchedService, Event, VendorService } from "@/types/marketplace";

const VENDORS_PER_PAGE = 10;

const VendorDiscovery = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedVendor, setSelectedVendor] = useState<MatchedVendor | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInquiries, setSentInquiries] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("match");
  const [filterService, setFilterService] = useState<string>("all");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ALL hooks must be before any conditional returns
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

  const { data: matchedVendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['matched-vendors', eventId, event?.city, event?.budget_min, event?.budget_max, event?.event_type, eventServices],
    queryFn: async (): Promise<MatchedVendor[]> => {
      if (!event || !eventServices || eventServices.length === 0) return [];
      const requiredServiceIds = eventServices.map((es) => es.service_id);

      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select(`id, business_name, business_description, city, rating, total_reviews,
          supported_event_types, response_time_hours, verification_status,
          vendor_services (id, name, service_id, price_min, price_max, base_price, is_available)`)
        .eq('city', event.city)
        .eq('is_active', true);

      if (vendorsError) throw vendorsError;
      if (!vendors) return [];

      const matched: MatchedVendor[] = [];
      for (const vendor of vendors) {
        const vendorEventTypes = (vendor as any).supported_event_types as string[] | null;
        if (event.event_type && vendorEventTypes && vendorEventTypes.length > 0) {
          if (!vendorEventTypes.includes(event.event_type)) continue;
        }

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

        matched.push({
          id: vendor.id, business_name: vendor.business_name,
          business_description: vendor.business_description, city: vendor.city || '',
          rating: vendor.rating, total_reviews: vendor.total_reviews, matchedServices,
        });
      }
      return matched;
    },
    enabled: !!event && !!eventServices && eventServices.length > 0,
  });

  const filteredAndSorted = useMemo(() => {
    if (!matchedVendors) return [];
    let result = [...matchedVendors];
    if (filterService !== 'all') {
      result = result.filter(v => v.matchedServices.some(s => s.name.toLowerCase().includes(filterService.toLowerCase())));
    }
    switch (sortBy) {
      case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'price-low': result.sort((a, b) => Math.min(...a.matchedServices.map(s => s.price_min)) - Math.min(...b.matchedServices.map(s => s.price_min))); break;
      case 'price-high': result.sort((a, b) => Math.max(...b.matchedServices.map(s => s.price_max)) - Math.max(...a.matchedServices.map(s => s.price_max))); break;
      case 'services': result.sort((a, b) => b.matchedServices.length - a.matchedServices.length); break;
      default: result.sort((a, b) => { const d = b.matchedServices.length - a.matchedServices.length; return d !== 0 ? d : (b.rating || 0) - (a.rating || 0); });
    }
    return result;
  }, [matchedVendors, filterService, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / VENDORS_PER_PAGE);
  const paginatedVendors = filteredAndSorted.slice((currentPage - 1) * VENDORS_PER_PAGE, currentPage * VENDORS_PER_PAGE);

  const serviceNames = useMemo(() => {
    if (!matchedVendors) return [];
    const names = new Set<string>();
    matchedVendors.forEach(v => v.matchedServices.forEach(s => names.add(s.name)));
    return Array.from(names);
  }, [matchedVendors]);

  const compareVendors = useMemo(() => {
    if (!matchedVendors) return [];
    return matchedVendors.filter(v => compareIds.has(v.id));
  }, [matchedVendors, compareIds]);

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

  // Now safe to do conditional returns
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
                <Badge key={es.service_id} variant="secondary">{es.services?.name}</Badge>
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
              <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{vendor.business_name}</h3>
                        {vendor.rating && vendor.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{Number(vendor.rating).toFixed(1)}</span>
                            <span className="text-muted-foreground">({vendor.total_reviews})</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />{getCityLabel(vendor.city)}
                      </div>
                      {vendor.business_description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.business_description}</p>
                      )}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Services & Pricing:</p>
                        <div className="flex flex-wrap gap-2">
                          {vendor.matchedServices.map((s, idx) => (
                            <Badge key={idx} variant="outline">
                              {s.name} <span className="text-muted-foreground ml-1">{formatPriceRange(s.price_min, s.price_max)}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {isInquirySent(vendor.id) ? (
                        <Button variant="outline" disabled><Check className="h-4 w-4 mr-1" />Inquiry Sent</Button>
                      ) : (
                        <Button onClick={() => setSelectedVendor(vendor)}><Send className="h-4 w-4 mr-1" />Send Inquiry</Button>
                      )}
                      <Button variant="outline" onClick={() => navigate(`/marketplace/vendor/${vendor.id}`)}>View Profile</Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => saveMutation.mutate(vendor.id)}
                          className={savedVendorIds?.includes(vendor.id) ? 'text-destructive' : 'text-muted-foreground'}>
                          <Heart className={`h-4 w-4 ${savedVendorIds?.includes(vendor.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleCompare(vendor.id)}
                          className={compareIds.has(vendor.id) ? 'text-primary' : 'text-muted-foreground'}>
                          <GitCompareArrows className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

        {/* Comparison Dialog */}
        <Dialog open={showCompare} onOpenChange={setShowCompare}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                      <div className="text-sm text-muted-foreground"><MapPin className="h-3 w-3 inline mr-1" />{getCityLabel(v.city)}</div>
                      {v.rating && v.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{Number(v.rating).toFixed(1)} ({v.total_reviews})
                        </div>
                      )}
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

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCityLabel, formatPriceRange } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, MapPin, Star, Send, Check, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MatchedVendor, MatchedService, Event, VendorService } from "@/types/marketplace";

const VendorDiscovery = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedVendor, setSelectedVendor] = useState<MatchedVendor | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInquiries, setSentInquiries] = useState<Set<string>>(new Set());

  // If no eventId, show fallback UI prompting to create an event
  if (!eventId) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/marketplace')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-16 w-16 text-muted-foreground mb-6" />
              <h2 className="text-2xl font-bold mb-3">Browse Vendors</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                To see vendors that match your needs, create an event first. 
                This helps us show you vendors in your city, within your budget, 
                and offering the services you need.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/marketplace/events/create')}
              >
                Create an Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch event details
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!eventId,
  });

  // Fetch event required services
  const { data: eventServices } = useQuery({
    queryKey: ['event-services', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_services')
        .select(`
          service_id,
          services (
            id,
            name
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  // Fetch existing inquiries for this event
  const { data: existingInquiries } = useQuery({
    queryKey: ['event-inquiries', eventId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('inquiries')
        .select('vendor_id')
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(i => i.vendor_id) || [];
    },
    enabled: !!eventId && !!user,
  });

  // Fetch matching vendors using the exact matching logic
  const { data: matchedVendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['matched-vendors', eventId, event?.city, event?.budget_min, event?.budget_max, eventServices],
    queryFn: async (): Promise<MatchedVendor[]> => {
      if (!event || !eventServices || eventServices.length === 0) return [];

      const requiredServiceIds = eventServices.map((es) => es.service_id);

      // Fetch vendors in the same city
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          id,
          business_name,
          business_description,
          city,
          rating,
          total_reviews,
          vendor_services (
            id,
            name,
            service_id,
            price_min,
            price_max,
            base_price,
            is_available
          )
        `)
        .eq('city', event.city)
        .eq('is_active', true);

      if (vendorsError) throw vendorsError;

      if (!vendors) return [];

      // Filter vendors based on EXACT matching logic
      const matched: MatchedVendor[] = [];

      for (const vendor of vendors) {
        const vendorServices = vendor.vendor_services as VendorService[] | null;
        
        // Check if vendor offers at least one required service
        const vendorServiceIds = vendorServices
          ?.filter((vs) => vs.is_available && vs.service_id)
          .map((vs) => vs.service_id) || [];

        const hasRequiredService = requiredServiceIds.some((reqId: string) => 
          vendorServiceIds.includes(reqId)
        );

        if (!hasRequiredService) continue;

        // Check if vendor's price range overlaps with event budget
        const matchingServices = vendorServices?.filter((vs) => 
          vs.is_available && requiredServiceIds.includes(vs.service_id || '')
        ) || [];

        let priceOverlaps = false;
        const matchedServices: MatchedService[] = [];

        for (const vs of matchingServices) {
          const priceMin = vs.price_min || vs.base_price || 0;
          const priceMax = vs.price_max || vs.base_price || 0;
          
          // Normalize price range (ensure min <= max)
          const normalizedMin = Math.min(priceMin, priceMax);
          const normalizedMax = Math.max(priceMin, priceMax);
          
          // Price range overlap: vendor's range overlaps with event's budget
          // Overlap exists if: vendor_min <= event_max AND vendor_max >= event_min
          if (normalizedMin <= (event.budget_max || Infinity) && normalizedMax >= (event.budget_min || 0)) {
            priceOverlaps = true;
            matchedServices.push({
              name: vs.name,
              price_min: normalizedMin,
              price_max: normalizedMax,
            });
          }
        }

        if (!priceOverlaps) continue;

        matched.push({
          id: vendor.id,
          business_name: vendor.business_name,
          business_description: vendor.business_description,
          city: vendor.city || '',
          rating: vendor.rating,
          total_reviews: vendor.total_reviews,
          matchedServices,
        });
      }

      return matched;
    },
    enabled: !!event && !!eventServices && eventServices.length > 0,
  });

  const handleSendInquiry = async () => {
    if (!selectedVendor || !user || !eventId) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('inquiries')
        .insert({
          event_id: eventId,
          vendor_id: selectedVendor.id,
          user_id: user.id,
          message: inquiryMessage || null,
          status: 'pending',
        });

      if (error) throw error;

      setSentInquiries(prev => new Set([...prev, selectedVendor.id]));
      
      toast({
        title: "Inquiry sent!",
        description: `Your inquiry has been sent to ${selectedVendor.business_name}`,
      });

      setSelectedVendor(null);
      setInquiryMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send inquiry';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInquirySent = (vendorId: string) => {
    return sentInquiries.has(vendorId) || existingInquiries?.includes(vendorId);
  };

  if (eventLoading || vendorsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => navigate('/marketplace')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="font-semibold mb-2">Event not found</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                This event may have been deleted or you don't have access to it.
              </p>
              <Button onClick={() => navigate('/marketplace/events/create')}>
                Create New Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/marketplace')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Event Summary */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>
              Finding vendors in {getCityLabel(event.city || '')} • 
              Budget: {formatPriceRange(event.budget_min, event.budget_max)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {eventServices?.map((es) => (
                <Badge key={es.service_id} variant="secondary">
                  {es.services?.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Matching Vendors */}
        <h2 className="text-xl font-bold mb-4">
          Matching Vendors ({matchedVendors?.length || 0})
        </h2>

        {matchedVendors && matchedVendors.length > 0 ? (
          <div className="space-y-4">
            {matchedVendors.map((vendor) => (
              <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{vendor.business_name}</h3>
                        {vendor.rating && vendor.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{vendor.rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">
                              ({vendor.total_reviews} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        {getCityLabel(vendor.city)}
                      </div>

                      {vendor.business_description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {vendor.business_description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Services & Pricing:</p>
                        <div className="flex flex-wrap gap-2">
                          {vendor.matchedServices.map((service, idx) => (
                            <Badge key={idx} variant="outline" className="flex items-center gap-1">
                              {service.name}
                              <span className="text-muted-foreground">
                                {formatPriceRange(service.price_min, service.price_max)}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {isInquirySent(vendor.id) ? (
                        <Button variant="outline" disabled className="flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Inquiry Sent
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setSelectedVendor(vendor)}
                          className="flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          Send Inquiry
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/marketplace/vendor/${vendor.id}`)}
                      >
                        View Profile
                      </Button>
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
              <p className="text-sm text-muted-foreground max-w-md">
                We couldn't find vendors matching your criteria. Try adjusting your budget range 
                or check back later as new vendors join our platform.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Inquiry Dialog */}
        <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Inquiry to {selectedVendor?.business_name}</DialogTitle>
              <DialogDescription>
                The vendor will receive your event details and can respond with their availability.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Add any specific requirements or questions..."
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedVendor(null)}>
                Cancel
              </Button>
              <Button onClick={handleSendInquiry} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Inquiry"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VendorDiscovery;
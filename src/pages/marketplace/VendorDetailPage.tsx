import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CITIES } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, MapPin, Star, Phone, Mail, IndianRupee } from "lucide-react";

const VendorDetailPage = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams<{ vendorId: string }>();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-detail', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_services (
            id,
            name,
            description,
            price_min,
            price_max,
            base_price,
            is_available,
            services (name)
          )
        `)
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  const getCityLabel = (cityValue: string) => {
    return CITIES.find(c => c.value === cityValue)?.label || cityValue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Vendor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Vendor Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{vendor.business_name}</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {getCityLabel(vendor.city || '')}
                  </div>
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
              </div>
              <Badge variant={vendor.verification_status === 'verified' ? 'default' : 'secondary'}>
                {vendor.verification_status === 'verified' ? 'Verified' : 'Pending Verification'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {vendor.business_description && (
              <p className="text-muted-foreground mb-4">{vendor.business_description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              {vendor.business_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {vendor.business_phone}
                </div>
              )}
              {vendor.business_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {vendor.business_email}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <h2 className="text-xl font-bold mb-4">Services Offered</h2>
        <div className="space-y-4">
          {vendor.vendor_services?.filter((vs: any) => vs.is_available).map((service: any) => (
            <Card key={service.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{service.services?.name || service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-semibold">
                      <IndianRupee className="h-4 w-4" />
                      {(service.price_min || service.base_price || 0).toLocaleString()}
                      {service.price_max && service.price_max !== service.price_min && (
                        <span> - ₹{service.price_max.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!vendor.vendor_services || vendor.vendor_services.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              No services listed yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendorDetailPage;

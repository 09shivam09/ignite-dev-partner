import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { CITIES } from "@/lib/constants";
import { Loader2, IndianRupee, Trash2 } from "lucide-react";

interface ServicePricing {
  service_id: string;
  price_min: number;
  price_max: number;
}

const VendorOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: services, isLoading: servicesLoading } = useServices();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    city: "",
    phone: "",
  });
  const [selectedServices, setSelectedServices] = useState<ServicePricing[]>([]);

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices([
        ...selectedServices,
        { service_id: serviceId, price_min: 0, price_max: 0 }
      ]);
    } else {
      setSelectedServices(selectedServices.filter(s => s.service_id !== serviceId));
    }
  };

  const updateServicePrice = (serviceId: string, field: 'price_min' | 'price_max', value: number) => {
    setSelectedServices(selectedServices.map(s => 
      s.service_id === serviceId ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one service",
        variant: "destructive",
      });
      return;
    }

    // Validate price ranges
    for (const service of selectedServices) {
      if (service.price_min <= 0 || service.price_max <= 0) {
        toast({
          title: "Error",
          description: "Please enter valid price ranges for all services",
          variant: "destructive",
        });
        return;
      }
      if (service.price_min > service.price_max) {
        toast({
          title: "Error",
          description: "Minimum price cannot be greater than maximum price",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Create vendor profile
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          business_description: formData.description,
          city: formData.city,
          business_phone: formData.phone,
          is_active: true,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (vendorError) throw vendorError;

      // Create vendor services with pricing
      const vendorServicesData = selectedServices.map(s => ({
        vendor_id: vendor.id,
        service_id: s.service_id,
        name: services?.find(svc => svc.id === s.service_id)?.name || 'Service',
        base_price: s.price_min,
        price_min: s.price_min,
        price_max: s.price_max,
        is_available: true,
      }));

      const { error: servicesError } = await supabase
        .from('vendor_services')
        .insert(vendorServicesData);

      if (servicesError) throw servicesError;

      toast({
        title: "Success!",
        description: "Your vendor profile has been created. Please log in again to access your dashboard.",
      });

      // Sign out and redirect to login so auth context picks up the new vendor profile cleanly
      await supabase.auth.signOut();
      navigate("/marketplace/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || servicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedServiceIds = selectedServices.map(s => s.service_id);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Vendor Onboarding</CardTitle>
            <CardDescription>
              Set up your vendor profile to start receiving inquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Business Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Enter your business name"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your services and experience..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Services Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Services You Offer</h3>
                <p className="text-sm text-muted-foreground">
                  Select the services you provide and set your price range for each
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {services?.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                        selectedServiceIds.includes(service.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        id={service.id}
                        checked={selectedServiceIds.includes(service.id)}
                        onCheckedChange={(checked) => 
                          handleServiceToggle(service.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={service.id} className="cursor-pointer text-sm">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Ranges for Selected Services */}
              {selectedServices.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Price Ranges (₹)</h3>
                  <p className="text-sm text-muted-foreground">
                    Set your minimum and maximum price for each service
                  </p>

                  <div className="space-y-4">
                    {selectedServices.map((selectedService) => {
                      const service = services?.find(s => s.id === selectedService.service_id);
                      return (
                        <div key={selectedService.service_id} className="p-4 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="font-medium">{service?.name}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleServiceToggle(selectedService.service_id, false)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Min Price</Label>
                              <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="10000"
                                  className="pl-9"
                                  value={selectedService.price_min || ''}
                                  onChange={(e) => updateServicePrice(
                                    selectedService.service_id,
                                    'price_min',
                                    parseInt(e.target.value) || 0
                                  )}
                                  min={0}
                                  required
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Max Price</Label>
                              <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="50000"
                                  className="pl-9"
                                  value={selectedService.price_max || ''}
                                  onChange={(e) => updateServicePrice(
                                    selectedService.service_id,
                                    'price_max',
                                    parseInt(e.target.value) || 0
                                  )}
                                  min={0}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorOnboarding;

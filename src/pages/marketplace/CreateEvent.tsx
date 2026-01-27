import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { CITIES, EVENT_TYPES } from "@/lib/constants";
import { Loader2, IndianRupee, ArrowLeft } from "lucide-react";

const CreateEvent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: services, isLoading: servicesLoading } = useServices();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    eventType: searchParams.get('type') || "",
    city: "",
    eventDate: "",
    budgetMin: "",
    budgetMax: "",
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    }
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
        description: "Please select at least one service you need",
        variant: "destructive",
      });
      return;
    }

    const budgetMin = parseInt(formData.budgetMin);
    const budgetMax = parseInt(formData.budgetMax);

    if (budgetMin <= 0 || budgetMax <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid budget range",
        variant: "destructive",
      });
      return;
    }

    if (budgetMin > budgetMax) {
      toast({
        title: "Error",
        description: "Minimum budget cannot be greater than maximum budget",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          creator_id: user.id,
          title: formData.title,
          event_type: formData.eventType,
          city: formData.city,
          event_date: formData.eventDate || null,
          budget_min: budgetMin,
          budget_max: budgetMax,
          status: 'active',
          is_public: false,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create event services
      const eventServicesData = selectedServices.map(serviceId => ({
        event_id: event.id,
        service_id: serviceId,
      }));

      const { error: servicesError } = await supabase
        .from('event_services')
        .insert(eventServicesData);

      if (servicesError) throw servicesError;

      toast({
        title: "Event created!",
        description: "Now let's find vendors for your event.",
      });

      navigate(`/marketplace/events/${event.id}/vendors`);
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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/marketplace')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Event</CardTitle>
            <CardDescription>
              Tell us about your event to find the perfect vendors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Name *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Sharma Wedding, Riya's Birthday"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Event Type *</Label>
                    <Select
                      value={formData.eventType}
                      onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Budget Range */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Budget Range (₹)</h3>
                <p className="text-sm text-muted-foreground">
                  What's your overall budget for this event?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Minimum Budget *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="budgetMin"
                        type="number"
                        placeholder="50000"
                        className="pl-9"
                        value={formData.budgetMin}
                        onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                        min={0}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Maximum Budget *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="budgetMax"
                        type="number"
                        placeholder="200000"
                        className="pl-9"
                        value={formData.budgetMax}
                        onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                        min={0}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Services Required</h3>
                <p className="text-sm text-muted-foreground">
                  Select the services you need for your event
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {services?.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                        selectedServices.includes(service.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => 
                          handleServiceToggle(service.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`service-${service.id}`} className="cursor-pointer text-sm">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  "Create Event & Find Vendors"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { 
  CITIES, 
  EVENT_TYPES, 
  EVENT_SERVICE_SUGGESTIONS, 
  BUDGET_GUIDANCE, 
  EVENT_CHECKLIST,
  EVENT_TYPE_EMOJI 
} from "@/lib/constants";
import { Loader2, IndianRupee, ArrowLeft, ArrowRight, Check, Lightbulb, CheckSquare } from "lucide-react";
import BudgetRangeSlider from "@/components/marketplace/user/BudgetRangeSlider";

const STEPS = [
  { id: 'type', label: 'Event Type' },
  { id: 'city', label: 'City' },
  { id: 'budget', label: 'Budget' },
  { id: 'services', label: 'Services' },
  { id: 'details', label: 'Details' },
] as const;

const CreateEvent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data: services, isLoading: servicesLoading } = useServices();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    eventType: searchParams.get('type') || "",
    city: "",
    eventDate: "",
    budgetMin: "",
    budgetMax: "",
  });
  const [budgetSliderValue, setBudgetSliderValue] = useState<[number, number] | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Auto-advance if event type is pre-selected from URL
  useEffect(() => {
    if (searchParams.get('type') && currentStep === 0) {
      setCurrentStep(1);
    }
  }, []);

  // Get suggested services for current event type
  const suggestedServiceNames = useMemo(() => {
    if (!formData.eventType) return [];
    return EVENT_SERVICE_SUGGESTIONS[formData.eventType] || [];
  }, [formData.eventType]);

  // Get budget guidance
  const budgetGuide = formData.eventType ? BUDGET_GUIDANCE[formData.eventType] : null;

  // Get event checklist
  const checklist = formData.eventType ? EVENT_CHECKLIST[formData.eventType] : [];

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return !!formData.eventType;
      case 1: return !!formData.city;
      case 2: return (!!formData.budgetMin && !!formData.budgetMax) || (budgetSliderValue !== null && budgetSliderValue[0] > 0 && budgetSliderValue[1] > budgetSliderValue[0]);
      case 3: return selectedServices.length > 0;
      case 4: return !!formData.title;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    if (selectedServices.length === 0) {
      toast({ title: "Error", description: "Please select at least one service", variant: "destructive" });
      return;
    }

    const budgetMin = budgetSliderValue ? budgetSliderValue[0] : parseInt(formData.budgetMin);
    const budgetMax = budgetSliderValue ? budgetSliderValue[1] : parseInt(formData.budgetMax);

    if (isNaN(budgetMin) || isNaN(budgetMax) || budgetMin <= 0 || budgetMax <= 0) {
      toast({ title: "Error", description: "Please enter a valid budget range", variant: "destructive" });
      return;
    }

    const normalizedBudgetMin = Math.min(budgetMin, budgetMax);
    const normalizedBudgetMax = Math.max(budgetMin, budgetMax);

    setIsLoading(true);

    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          creator_id: user.id,
          title: formData.title,
          event_type: formData.eventType,
          city: formData.city,
          event_date: formData.eventDate || null,
          budget_min: normalizedBudgetMin,
          budget_max: normalizedBudgetMax,
          status: 'active',
          is_public: false,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const eventServicesData = selectedServices.map(serviceId => ({
        event_id: event.id,
        service_id: serviceId,
      }));

      const { error: servicesError } = await supabase
        .from('event_services')
        .insert(eventServicesData);

      if (servicesError) throw servicesError;

      toast({ title: "Event created!", description: "Now let's find vendors for your event." });
      navigate(`/marketplace/events/${event.id}/vendors`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create event';
      toast({ title: "Error", description: message, variant: "destructive" });
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
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => index < currentStep && setCurrentStep(index)}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index < currentStep
                    ? 'bg-primary text-primary-foreground cursor-pointer'
                    : index === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </button>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Event</CardTitle>
            <CardDescription>Tell us about your event to find the perfect vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Event Type */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What type of event are you planning?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {EVENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        className={`p-4 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                          formData.eventType === type.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setFormData({ ...formData, eventType: type.value })}
                      >
                        <div className="text-3xl mb-2">{EVENT_TYPE_EMOJI[type.value] || '🎉'}</div>
                        <p className="text-sm font-medium">{type.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: City */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Where is your event?</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {CITIES.map((city) => (
                      <button
                        key={city.value}
                        type="button"
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData.city === city.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setFormData({ ...formData, city: city.value })}
                      >
                        <p className="font-medium">{city.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Budget */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What's your budget range?</h3>
                  
                  <BudgetRangeSlider
                    eventType={formData.eventType}
                    value={budgetSliderValue || [
                      budgetGuide?.min || 50000,
                      budgetGuide?.max || 500000,
                    ]}
                    onChange={(val) => {
                      setBudgetSliderValue(val);
                      setFormData({ ...formData, budgetMin: String(val[0]), budgetMax: String(val[1]) });
                    }}
                  />
                </div>
              )}

              {/* Step 4: Services */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What services do you need?</h3>

                  {/* Suggested services */}
                  {suggestedServiceNames.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Suggested for {EVENT_TYPES.find(t => t.value === formData.eventType)?.label}:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {suggestedServiceNames.map((name) => (
                            <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {services?.map((service) => {
                      const isSuggested = suggestedServiceNames.some(
                        s => service.name.toLowerCase().includes(s.toLowerCase())
                      );
                      return (
                        <div
                          key={service.id}
                          className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                            selectedServices.includes(service.id)
                              ? 'border-primary bg-primary/5'
                              : isSuggested
                                ? 'border-primary/30 bg-primary/[0.02]'
                                : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={(checked) => handleServiceToggle(service.id, checked as boolean)}
                          />
                          <Label htmlFor={`service-${service.id}`} className="cursor-pointer text-sm flex-1">
                            {service.name}
                            {isSuggested && !selectedServices.includes(service.id) && (
                              <span className="text-xs text-primary ml-1">★</span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>

                  {/* Event checklist */}
                  {checklist.length > 0 && (
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Common checklist for {EVENT_TYPES.find(t => t.value === formData.eventType)?.label}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {checklist.map((item) => (
                          <Badge key={item} variant="outline" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Details */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Final Details</h3>
                  
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

                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date (optional)</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Summary */}
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
                    <h4 className="font-medium text-sm">Event Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>Type:</span>
                      <span>{EVENT_TYPES.find(t => t.value === formData.eventType)?.label}</span>
                      <span>City:</span>
                      <span>{CITIES.find(c => c.value === formData.city)?.label}</span>
                      <span>Budget:</span>
                      <span>₹{(budgetSliderValue ? budgetSliderValue[0] : parseInt(formData.budgetMin || '0')).toLocaleString()} - ₹{(budgetSliderValue ? budgetSliderValue[1] : parseInt(formData.budgetMax || '0')).toLocaleString()}</span>
                      <span>Services:</span>
                      <span>{selectedServices.length} selected</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading || !canProceed()}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Event & Find Vendors"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;

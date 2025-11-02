import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Users, MapPin, Calendar, IndianRupee, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlannerData {
  eventType: string;
  guestCount: string;
  budget: string;
  location: string;
  date: string;
  preferences: string;
}

const AIEventPlanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  
  const [plannerData, setPlannerData] = useState<PlannerData>({
    eventType: "",
    guestCount: "",
    budget: "",
    location: "",
    date: "",
    preferences: ""
  });

  const updateData = (field: keyof PlannerData, value: string) => {
    setPlannerData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleGeneratePlan();
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations", {
        body: {
          event_type: plannerData.eventType,
          guest_count: parseInt(plannerData.guestCount),
          location: plannerData.location,
          budget: parseInt(plannerData.budget),
          preferences: plannerData.preferences
        }
      });

      if (error) throw error;

      setRecommendations(data);
      setStep(4);
      toast({
        title: "Plan Generated! ✨",
        description: "Your personalized event plan is ready",
      });
    } catch (error: any) {
      console.error("AI Planner error:", error);
      toast({
        title: "Error",
        description: "Failed to generate plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return plannerData.eventType && plannerData.guestCount;
      case 2:
        return plannerData.budget && plannerData.location && plannerData.date;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <AppLayout>
      <SEOHead 
        title="AI Event Planner - EVENT-CONNECT"
        description="Let AI help you plan your perfect event. Get personalized vendor recommendations, budget breakdowns, and timeline suggestions."
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">AI-Powered Planning</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Plan Your Event with AI</h1>
          <p className="text-muted-foreground">
            Answer a few questions and let our AI create a personalized event plan
          </p>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Step {step} of 3</span>
              <span className="text-sm text-muted-foreground">{Math.round((step / 3) * 100)}%</span>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>
        )}

        {/* Step 1: Event Basics */}
        {step === 1 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Event Basics</h2>
              <Separator className="mb-6" />
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventType" className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    What type of event are you planning?
                  </Label>
                  <Select value={plannerData.eventType} onValueChange={(val) => updateData("eventType", val)}>
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="birthday">Birthday Party</SelectItem>
                      <SelectItem value="corporate">Corporate Event</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="other">Other Celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="guestCount" className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    Expected number of guests
                  </Label>
                  <Input
                    id="guestCount"
                    type="number"
                    placeholder="e.g., 100"
                    value={plannerData.guestCount}
                    onChange={(e) => updateData("guestCount", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Budget & Location */}
        {step === 2 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Budget & Location</h2>
              <Separator className="mb-6" />
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget" className="flex items-center gap-2 mb-2">
                    <IndianRupee className="h-4 w-4" />
                    Your budget (in ₹)
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 200000"
                    value={plannerData.budget}
                    onChange={(e) => updateData("budget", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Event location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Mumbai"
                    value={plannerData.location}
                    onChange={(e) => updateData("location", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="date" className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    Preferred date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={plannerData.date}
                    onChange={(e) => updateData("date", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Your Preferences</h2>
              <Separator className="mb-6" />
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preferences" className="mb-2 block">
                    Tell us about your vision (optional)
                  </Label>
                  <Textarea
                    id="preferences"
                    placeholder="E.g., I want an outdoor wedding with rustic decor, floral arrangements, and live music..."
                    value={plannerData.preferences}
                    onChange={(e) => updateData("preferences", e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    The more details you provide, the better our AI can customize your plan
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === 4 && recommendations && (
          <Card className="p-6 space-y-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Your Event Plan is Ready! 🎉</h2>
              <p className="text-muted-foreground">
                Here's what we recommend for your {plannerData.eventType}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Recommended Budget Allocation</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Badge variant="outline" className="justify-between p-3">
                    <span>Venue</span>
                    <span className="font-bold">30%</span>
                  </Badge>
                  <Badge variant="outline" className="justify-between p-3">
                    <span>Catering</span>
                    <span className="font-bold">25%</span>
                  </Badge>
                  <Badge variant="outline" className="justify-between p-3">
                    <span>Decoration</span>
                    <span className="font-bold">20%</span>
                  </Badge>
                  <Badge variant="outline" className="justify-between p-3">
                    <span>Photography</span>
                    <span className="font-bold">15%</span>
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-bold mb-3">Recommended Vendors</h3>
                <div className="space-y-2">
                  {["Venue", "Catering", "Photography", "Decoration"].map((service) => (
                    <Button
                      key={service}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => navigate(`/search?category=${service.toLowerCase()}`)}
                    >
                      <span>Browse {service} Vendors</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => navigate("/search")}>
                Start Booking Vendors
              </Button>
              <Button variant="outline" onClick={() => setStep(1)}>
                Create New Plan
              </Button>
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex-1"
            >
              {loading ? "Generating..." : step === 3 ? "Generate Plan" : "Next"}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AIEventPlanner;

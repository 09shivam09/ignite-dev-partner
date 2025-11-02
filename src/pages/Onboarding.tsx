import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Sparkles, Shield, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const slides = [
  {
    title: "Discover Premium Vendors",
    description: "Find the best event service providers in your area with AI-powered recommendations",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 via-pink-500/10 to-transparent",
  },
  {
    title: "Book with Confidence",
    description: "Read authentic reviews, compare prices, and book multiple services seamlessly",
    icon: Shield,
    color: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 via-cyan-500/10 to-transparent",
  },
  {
    title: "Plan Perfect Events",
    description: "Manage all your bookings in one place with smart calendar sync and reminders",
    icon: Calendar,
    color: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 via-teal-500/10 to-transparent",
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    event_type: "",
    city: "",
    date: "",
    budget_range: "",
    guest_count: ""
  });

  useEffect(() => {
    // Reset animation on slide change
    const timer = setTimeout(() => {
      setDirection('next');
    }, 50);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection('next');
      setCurrentSlide(currentSlide + 1);
    } else {
      setShowForm(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth/signup");
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          preferences: profileData,
          city: profileData.city
        });

      if (error) throw error;

      // Store in localStorage as well
      localStorage.setItem('onboarding_data', JSON.stringify(profileData));

      toast({
        title: "Profile saved!",
        description: "Your preferences have been saved successfully."
      });
      
      navigate("/");
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection('prev');
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    if (showForm) {
      navigate("/");
    } else {
      navigate("/auth/signup");
    }
  };

  const CurrentIcon = slides[currentSlide].icon;

  if (showForm) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-primary/5 to-accent/10 p-6">
        <div className="flex justify-end mb-4">
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
        </div>
        
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Tell us about your event</h1>
            <p className="text-muted-foreground">Help us personalize your experience</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="event_type">Event Type</Label>
              <Select value={profileData.event_type} onValueChange={(val) => setProfileData({...profileData, event_type: val})}>
                <SelectTrigger id="event_type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Enter your city"
                value={profileData.city}
                onChange={(e) => setProfileData({...profileData, city: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="date">Event Date (Optional)</Label>
              <Input
                id="date"
                type="date"
                value={profileData.date}
                onChange={(e) => setProfileData({...profileData, date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="budget_range">Budget Range</Label>
              <Select value={profileData.budget_range} onValueChange={(val) => setProfileData({...profileData, budget_range: val})}>
                <SelectTrigger id="budget_range">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-50000">₹0 - ₹50,000</SelectItem>
                  <SelectItem value="50000-100000">₹50,000 - ₹1,00,000</SelectItem>
                  <SelectItem value="100000-200000">₹1,00,000 - ₹2,00,000</SelectItem>
                  <SelectItem value="200000+">₹2,00,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="guest_count">Expected Guest Count</Label>
              <Input
                id="guest_count"
                type="number"
                placeholder="Number of guests"
                value={profileData.guest_count}
                onChange={(e) => setProfileData({...profileData, guest_count: e.target.value})}
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} className="w-full" size="lg">
            Save & Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-primary/5 to-accent/10 overflow-hidden">
      {/* Skip Button */}
      <div className="flex justify-end p-6 animate-fade-in-down">
        <Button 
          variant="ghost" 
          onClick={handleSkip} 
          className="text-muted-foreground hover:text-foreground transition-smooth"
        >
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20 relative">
        {/* Background Gradient Circle */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].bgGradient} blur-3xl opacity-30 transition-all duration-700`}
          style={{ 
            transform: `scale(${currentSlide === 0 ? 1 : currentSlide === 1 ? 1.2 : 1.4})` 
          }}
        />

        {/* Content */}
        <div 
          key={currentSlide}
          className={`text-center relative z-10 ${
            direction === 'next' ? 'animate-fade-in-up' : 'animate-fade-in-down'
          }`}
        >
          {/* Icon with Gradient Background */}
          <div className="mb-8 flex justify-center">
            <div className={`relative p-8 rounded-full bg-gradient-to-br ${slides[currentSlide].color} shadow-glow animate-scale-bounce`}>
              <CurrentIcon className="h-20 w-20 text-white" strokeWidth={1.5} />
              <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse-glow" />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-4xl md:text-5xl font-bold text-foreground max-w-2xl animate-fade-in-up [animation-delay:0.1s]">
            {slides[currentSlide].title}
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed animate-fade-in-up [animation-delay:0.2s]">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="mt-16 flex space-x-3 animate-fade-in-up [animation-delay:0.3s]">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 'next' : 'prev');
                setCurrentSlide(index);
              }}
              className={`h-2.5 rounded-full transition-all duration-500 hover:scale-110 ${
                index === currentSlide
                  ? "w-10 bg-gradient-to-r " + slides[currentSlide].color
                  : "w-2.5 bg-muted hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="p-6 space-y-4 animate-slide-up">
        {/* Next/Get Started Button */}
        <Button
          onClick={handleNext}
          className={`w-full bg-gradient-to-r ${slides[currentSlide].color} hover:opacity-90 text-white shadow-lg hover-lift tap-effect`}
          size="lg"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Previous Button */}
        {currentSlide > 0 && (
          <Button
            onClick={handlePrev}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            size="lg"
          >
            Previous
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

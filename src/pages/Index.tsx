import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Bell, LogOut, Sparkles, GitCompare, Image } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CategoryGrid } from "@/components/CategoryGrid";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AISupportChat } from "@/components/AISupportChat";
import { FeedbackForm } from "@/components/FeedbackForm";
import { EventTypeSelector } from "@/components/EventTypeSelector";
import { TrendingThemes } from "@/components/TrendingThemes";
import { OffersCarousel } from "@/components/OffersCarousel";
import { BudgetPlanner } from "@/components/BudgetPlanner";
import { SmartRecommendations } from "@/components/SmartRecommendations";
import { analytics } from "@/lib/analytics";
import { setUserContext } from "@/lib/sentry";
import { AccessibilitySettings } from "@/components/AccessibilitySettings";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/hero-event-premium.jpg";
import vendorPhotographer from "@/assets/vendor-photographer.jpg";
import vendorCatering from "@/assets/vendor-catering.jpg";
import vendorVenue from "@/assets/vendor-venue.jpg";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Initialize analytics
    analytics.initialize();
    
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      
      // Set user context for error tracking
      setUserContext(session.user.id, session.user.email);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
        setUserContext(session.user.id, session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Track page views
  useEffect(() => {
    analytics.pageView(location.pathname);
  }, [location]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 pb-20">
      {/* Header */}
      <div className="sticky top-0 glass z-10 border-b border-border/50 shadow-md">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 group cursor-pointer transition-smooth hover:scale-105">
            <MapPin className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold group-hover:text-primary transition-colors">Mumbai, India</span>
          </div>
          <div className="flex items-center gap-2">
            <BudgetPlanner />
            <FeedbackForm />
            <AccessibilitySettings />
            <Button variant="ghost" size="icon" className="hover:scale-110 transition-smooth" onClick={() => navigate("/notifications")}>
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:scale-110 transition-smooth" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative cursor-pointer transition-smooth hover:scale-[1.02] group" onClick={() => navigate("/search")}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <Input
              placeholder="Search for services, vendors..."
              className="pl-10 glass border-border/50 focus:border-primary/50 transition-all"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={heroImage}
          alt="Event Planning" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-accent/80 to-primary/90" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-center animate-fade-in-up">
            Plan Your Perfect Event
          </h1>
          <p className="text-base opacity-95 text-center mb-6 max-w-md animate-fade-in [animation-delay:0.2s]">
            Discover premium vendors and create unforgettable moments
          </p>
          <Button 
            variant="glow"
            size="lg"
            className="bg-white text-primary hover:bg-white/90 shadow-xl animate-scale-in [animation-delay:0.4s]" 
            onClick={() => navigate("/search")}
          >
            Explore Services
          </Button>
        </div>
      </div>

      {/* Quick Access Tools */}
      <div className="px-6 pb-6">
        <h2 className="text-2xl font-bold mb-4">Planning Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="p-5 cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => navigate("/ai-planner")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">AI Event Planner</h3>
                <p className="text-sm text-muted-foreground">Get personalized recommendations</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-5 cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => navigate("/compare")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GitCompare className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">Compare Vendors</h3>
                <p className="text-sm text-muted-foreground">Side-by-side comparison</p>
              </div>
            </div>
          </Card>

          <Card 
            className="p-5 cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => navigate("/inspiration")}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Image className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">Inspiration Gallery</h3>
                <p className="text-sm text-muted-foreground">Browse event ideas</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Event Type Selector */}
      <div className="p-6">
        <EventTypeSelector />
      </div>

      {/* Offers Carousel */}
      <div className="px-6 pb-8">
        <OffersCarousel />
      </div>

      {/* Trending Themes */}
      <div className="px-6 pb-8">
        <TrendingThemes />
      </div>

      {/* Smart AI Recommendations */}
      <div className="px-6 pb-8">
        <SmartRecommendations 
          location="Mumbai"
          budget={50000}
        />
      </div>

      {/* Categories */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <div className="h-1 flex-1 ml-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full"></div>
        </div>
        <CategoryGrid />
      </div>

      {/* Featured Vendors */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Vendors</h2>
          <div className="h-1 flex-1 ml-4 bg-gradient-to-r from-accent/20 to-transparent rounded-full"></div>
        </div>
        <div className="space-y-5">
          {[
            {
              name: "Elite Photography",
              category: "Photography",
              rating: 4.9,
              price: "₹25,000",
              image: vendorPhotographer
            },
            {
              name: "Royal Caterers",
              category: "Catering",
              rating: 4.8,
              price: "₹15,000",
              image: vendorCatering
            },
            {
              name: "Grand Banquet Hall",
              category: "Venues",
              rating: 4.7,
              price: "₹50,000",
              image: vendorVenue
            }
          ].map((vendor, i) => (
            <div
              key={i}
              className="glass glass-hover rounded-2xl overflow-hidden cursor-pointer shadow-premium animate-fade-in group"
              onClick={() => navigate(`/vendor/${i + 1}`)}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute top-3 right-3 glass px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-white">{vendor.rating}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">{vendor.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{vendor.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gradient-accent font-bold text-lg">Starting at {vendor.price}</span>
                  <Button variant="outline" size="sm" className="group-hover:border-primary/40">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
      <AISupportChat />
    </div>
  );
};

export default Index;
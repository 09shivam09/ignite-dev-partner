import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Bell, LogOut, Sparkles, GitCompare, Image, Heart, Star, ArrowRight, Zap } from "lucide-react";
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
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-event-premium.jpg";
import vendorPhotographer from "@/assets/vendor-photographer.jpg";
import vendorCatering from "@/assets/vendor-catering.jpg";
import vendorVenue from "@/assets/vendor-venue.jpg";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    analytics.initialize();
    
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
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

  useEffect(() => {
    analytics.pageView(location.pathname);
  }, [location]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "See you soon! 👋",
      description: "You've been signed out successfully.",
    });
  };

  if (!user) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-love/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div 
        className="sticky top-0 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="glass border-b border-border/30">
          <div className="flex items-center justify-between p-4">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-accent to-love rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-sm font-semibold group-hover:text-primary transition-colors">Mumbai, India</span>
                <span className="text-xs text-muted-foreground block">📍 Change location</span>
              </div>
            </motion.div>
            <div className="flex items-center gap-1">
              <BudgetPlanner />
              <FeedbackForm />
              <AccessibilitySettings />
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 relative" onClick={() => navigate("/notifications")}>
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-accent to-love rounded-full" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-4">
            <motion.div 
              className="relative cursor-pointer group"
              onClick={() => navigate("/search")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <Input
                placeholder="Search vendors, services, themes... ✨"
                className="pl-12 pr-4 h-12 rounded-2xl bg-muted/50 border-border/50 hover:border-primary/30 focus:border-primary/50 transition-all text-base"
                readOnly
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary font-medium">
                ⌘K
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <motion.div 
        className="relative h-[420px] overflow-hidden mx-4 mt-4 rounded-3xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <img 
          src={heroImage}
          alt="Event Planning" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        {/* Floating decorative elements */}
        <motion.div 
          className="absolute top-8 right-8 text-4xl"
          animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ✨
        </motion.div>
        <motion.div 
          className="absolute bottom-20 left-8 text-3xl"
          animate={{ y: [0, -8, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        >
          🎉
        </motion.div>
        <motion.div 
          className="absolute top-1/3 right-12 text-2xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
        >
          💜
        </motion.div>

        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              {greeting}! Ready to plan?
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
              Create Magical
              <br />
              <span className="text-gradient-rainbow bg-clip-text">Moments</span> ✨
            </h1>
            <p className="text-base opacity-95 mb-6 max-w-md mx-auto">
              Discover amazing vendors and turn your dreams into unforgettable celebrations
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/95 shadow-xl rounded-2xl px-8 h-14 text-base font-semibold group" 
                onClick={() => navigate("/search")}
              >
                Start Exploring
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Access Tools */}
      <motion.div 
        className="px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Zap className="h-5 w-5 text-gold" />
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <span className="text-muted-foreground text-sm">⚡</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              title: "AI Event Planner", 
              desc: "Get personalized recommendations", 
              icon: Sparkles, 
              color: "primary",
              emoji: "🤖",
              path: "/ai-planner" 
            },
            { 
              title: "Compare Vendors", 
              desc: "Side-by-side comparison", 
              icon: GitCompare, 
              color: "secondary",
              emoji: "⚖️",
              path: "/compare" 
            },
            { 
              title: "Inspiration Gallery", 
              desc: "Browse event ideas", 
              icon: Image, 
              color: "love",
              emoji: "💡",
              path: "/inspiration" 
            },
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card 
                className="p-5 cursor-pointer card-interactive group border-border/50"
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className={`w-14 h-14 rounded-2xl bg-${item.color}/10 flex items-center justify-center relative`}
                    whileHover={{ rotate: 5 }}
                  >
                    <item.icon className={`h-6 w-6 text-${item.color}`} />
                    <span className="absolute -top-1 -right-1 text-sm">{item.emoji}</span>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Event Type Selector */}
      <div className="px-4 pb-8">
        <EventTypeSelector />
      </div>

      {/* Offers Carousel */}
      <div className="px-4 pb-8">
        <OffersCarousel />
      </div>

      {/* Trending Themes */}
      <div className="px-4 pb-8">
        <TrendingThemes />
      </div>

      {/* Smart AI Recommendations */}
      <div className="px-4 pb-8">
        <SmartRecommendations 
          location="Mumbai"
          budget={50000}
        />
      </div>

      {/* Categories */}
      <motion.div 
        className="px-4 pb-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <span className="text-lg">🎨</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Browse Categories</h2>
            <p className="text-xs text-muted-foreground">Find exactly what you need</p>
          </div>
        </div>
        <CategoryGrid />
      </motion.div>

      {/* Featured Vendors */}
      <motion.div 
        className="px-4 pb-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Featured Vendors</h2>
              <p className="text-xs text-muted-foreground">Top-rated this month ⭐</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-xl">
            See all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          {[
            {
              name: "Elite Photography",
              category: "Photography",
              rating: 4.9,
              reviews: 128,
              price: "₹25,000",
              image: vendorPhotographer,
              badge: "🔥 Hot"
            },
            {
              name: "Royal Caterers",
              category: "Catering",
              rating: 4.8,
              reviews: 96,
              price: "₹15,000",
              image: vendorCatering,
              badge: "⭐ Popular"
            },
            {
              name: "Grand Banquet Hall",
              category: "Venues",
              rating: 4.7,
              reviews: 84,
              price: "₹50,000",
              image: vendorVenue,
              badge: "✨ Premium"
            }
          ].map((vendor, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="card-interactive rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/vendor/${i + 1}`)}
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Badge */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-semibold shadow-lg">
                  {vendor.badge}
                </div>
                
                {/* Rating pill */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  <span>{vendor.rating}</span>
                  <span className="text-white/70">({vendor.reviews})</span>
                </div>

                {/* Favorite button */}
                <motion.button 
                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toast({ title: "Added to favorites! 💖" });
                  }}
                >
                  <Heart className="h-5 w-5 text-love hover:fill-love transition-colors" />
                </motion.button>
              </div>
              
              <div className="p-5 bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      {vendor.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Starting from</span>
                    <p className="text-lg font-bold text-gradient-primary">{vendor.price}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-primary/30 hover:bg-primary hover:text-primary-foreground group/btn">
                    View Details
                    <ArrowRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Fun CTA Section */}
      <motion.div 
        className="mx-4 mb-8 p-8 rounded-3xl bg-gradient-hero text-white relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 text-4xl animate-float">🎊</div>
        <div className="absolute bottom-4 left-4 text-3xl animate-float" style={{ animationDelay: '1s' }}>✨</div>
        
        <div className="relative z-10 text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to plan your dream event?</h3>
          <p className="opacity-90 mb-6">Let's make it happen together! 💜</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/95 rounded-2xl px-8 font-semibold shadow-xl"
              onClick={() => navigate("/ai-planner")}
            >
              Start Planning Now
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <BottomNavigation />
      <AISupportChat />
    </div>
  );
};

export default Index;

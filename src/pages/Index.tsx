import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CategoryGrid } from "@/components/CategoryGrid";
import { BottomNavigation } from "@/components/BottomNavigation";
import { AISupportChat } from "@/components/AISupportChat";
import { FeedbackForm } from "@/components/FeedbackForm";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out successfully.",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Mumbai, India</span>
          </div>
          <div className="flex items-center gap-2">
            <FeedbackForm />
            <Button variant="ghost" size="icon" onClick={() => navigate("/notifications")}>
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative cursor-pointer" onClick={() => navigate("/search")}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for services, vendors..."
              className="pl-10 bg-background"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 via-accent/10 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative h-full flex flex-col justify-center items-center text-center p-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
            Plan Your Perfect Event
          </h1>
          <p className="text-muted-foreground max-w-md animate-fade-in">
            Connect with top-rated vendors for catering, photography, venues, and more
          </p>
          <Button className="mt-6 animate-scale-in" onClick={() => navigate("/search")}>
            Explore Services
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
        <CategoryGrid />
      </div>

      {/* Featured Vendors */}
      <div className="px-6 pb-8">
        <h2 className="text-xl font-semibold mb-4">Featured Vendors</h2>
        <div className="space-y-4">
          {[
            {
              name: "Elite Photography",
              category: "Photography",
              rating: 4.9,
              price: "₹25,000",
              image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80"
            },
            {
              name: "Royal Caterers",
              category: "Catering",
              rating: 4.8,
              price: "₹15,000",
              image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80"
            },
            {
              name: "Grand Banquet Hall",
              category: "Venues",
              rating: 4.7,
              price: "₹50,000",
              image: "https://images.unsplash.com/photo-1519167758481-83f29da8a1c0?w=400&q=80"
            }
          ].map((vendor, i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-lg transition-all animate-fade-in"
              onClick={() => navigate(`/vendor/${i + 1}`)}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative h-40">
                <img
                  src={vendor.image}
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-success text-white px-2 py-1 rounded-full text-xs font-semibold">
                  ⭐ {vendor.rating}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{vendor.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{vendor.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-accent font-medium">Starting at {vendor.price}</span>
                  <Button variant="outline" size="sm">View Details</Button>
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
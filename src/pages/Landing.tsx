import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Calendar, 
  MessageCircle, 
  Shield, 
  Star, 
  Zap,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import heroImage from "@/assets/hero-event-premium.jpg";

const features = [
  {
    icon: Search,
    title: "Smart Discovery",
    description: "Find the perfect vendors using AI-powered recommendations"
  },
  {
    icon: Calendar,
    title: "Easy Booking",
    description: "Book multiple services in one seamless flow"
  },
  {
    icon: MessageCircle,
    title: "Direct Communication",
    description: "Chat with vendors in real-time to plan your event"
  },
  {
    icon: Shield,
    title: "Verified Vendors",
    description: "All service providers are verified and rated"
  },
  {
    icon: Star,
    title: "Review System",
    description: "See authentic reviews from real customers"
  },
  {
    icon: Zap,
    title: "Instant Updates",
    description: "Get real-time notifications on your bookings"
  }
];

const benefits = [
  "Save time by comparing multiple vendors in one place",
  "Transparent pricing with no hidden fees",
  "Secure payment processing",
  "24/7 customer support",
  "Money-back guarantee for eligible bookings"
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead 
        title="EVENT-CONNECT - Your Complete Event Planning Solution"
        description="Discover and book top-rated catering, photography, venues, and more. Plan your perfect event with verified local service providers."
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          <OptimizedImage
            src={heroImage}
            alt="Event planning hero showcasing beautiful celebrations"
            className="absolute inset-0 w-full h-full"
            eager
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
          
          <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Plan Your Perfect Event
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with verified local vendors for catering, photography, venues, and more. 
              Everything you need in one place.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth/signup')}
                className="text-lg"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/search')}
                className="text-lg"
              >
                Browse Vendors
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
              <p className="text-xl text-muted-foreground">
                Powerful features to make event planning effortless
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="p-6 space-y-4 hover-scale transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Why Choose EVENT-CONNECT?</h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of satisfied customers who planned their perfect events with us
              </p>
            </div>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg bg-background/50"
                >
                  <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Start Planning?</h2>
            <p className="text-xl text-muted-foreground">
              Create your free account and discover amazing vendors in your area
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth/signup')}
              className="text-lg"
            >
              Sign Up Now - It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-2xl font-bold">EVENT-CONNECT</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your trusted event planning partner
              </p>
            </div>
            <div className="flex gap-6">
              <button 
                onClick={() => navigate('/docs')}
                className="story-link text-sm hover:text-primary transition-colors"
              >
                Documentation
              </button>
              <button 
                onClick={() => navigate('/auth/login')}
                className="story-link text-sm hover:text-primary transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

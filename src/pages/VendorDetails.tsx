import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, MapPin, Star, Clock, MessageCircle, Share2, Heart } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ReviewInsights } from "@/components/ReviewInsights";
import portfolioCatering1 from "@/assets/portfolio-catering-1.jpg";
import portfolioCatering2 from "@/assets/portfolio-catering-2.jpg";
import portfolioDecoration1 from "@/assets/portfolio-decoration-1.jpg";
import portfolioDecoration2 from "@/assets/portfolio-decoration-2.jpg";

const mockServices = [
  { id: 1, name: "Basic Package", price: 500, description: "Perfect for small gatherings" },
  { id: 2, name: "Premium Package", price: 1000, description: "Ideal for medium-sized events" },
  { id: 3, name: "Deluxe Package", price: 1500, description: "Ultimate event experience" },
];

const mockReviews = [
  { id: 1, name: "Sarah Johnson", rating: 5, date: "2 weeks ago", comment: "Outstanding service! Highly recommended." },
  { id: 2, name: "Michael Chen", rating: 5, date: "1 month ago", comment: "Professional and reliable. Will book again!" },
  { id: 3, name: "Emily Davis", rating: 4, date: "2 months ago", comment: "Great quality, good value for money." },
];

const VendorDetails = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-accent text-accent" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="relative">
        <Carousel className="w-full">
          <CarouselContent>
            {[portfolioCatering1, portfolioCatering2, portfolioDecoration1, portfolioDecoration2].map((img, i) => (
              <CarouselItem key={i}>
                <img src={img} alt={`Portfolio ${i + 1}`} className="h-64 w-full object-cover" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      </div>

      <main className="p-4 space-y-6">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Elite Catering Co</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>New York, NY • 2.3 km away</span>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span>4.9</span>
            </Badge>
          </div>
          <p className="text-muted-foreground mt-3">
            Premium catering services for all types of events. Over 10 years of experience creating
            memorable culinary experiences.
          </p>
          <div className="flex items-center space-x-4 mt-4 text-sm">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Available Today</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">Reviews (127)</TabsTrigger>
            <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4 mt-4">
            {mockServices.map((service) => (
              <div
                key={service.id}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  </div>
                  <span className="font-bold text-foreground">${service.price}</span>
                </div>
                <Button
                  className="w-full mt-3"
                  onClick={() => navigate(`/booking/${vendorId}?service=${service.id}`)}
                >
                  Book Now
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            <ReviewInsights vendorId={vendorId || "1"} />
            
            {mockReviews.map((review) => (
              <div key={review.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{review.name}</h4>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground">{review.comment}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="about" className="mt-4">
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Business Hours</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="text-foreground">9:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday - Sunday</span>
                    <span className="text-foreground">10:00 AM - 6:00 PM</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Service Areas</h3>
                <p className="text-sm text-muted-foreground">
                  Manhattan, Brooklyn, Queens, Bronx
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex space-x-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => navigate(`/chat/${vendorId}`)}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Message
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={() => navigate(`/booking/${vendorId}`)}
        >
          Book Service
        </Button>
      </div>
    </div>
  );
};

export default VendorDetails;

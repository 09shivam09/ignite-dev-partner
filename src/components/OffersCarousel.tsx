import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import offerCatering from "@/assets/offer-catering.jpg";
import offerPhotography from "@/assets/offer-photography.jpg";
import offerVenue from "@/assets/offer-venue.jpg";
import offerDecoration from "@/assets/offer-decoration.jpg";
import offerEntertainment from "@/assets/offer-entertainment.jpg";
import offerCake from "@/assets/offer-cake.jpg";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  image: string;
  category: string;
}

const offers: Offer[] = [
  {
    id: "1",
    title: "Wedding Season Special",
    description: "Get 25% off on premium catering packages",
    discount: "25% OFF",
    validUntil: "Dec 31, 2024",
    image: offerCatering,
    category: "Catering"
  },
  {
    id: "2",
    title: "Photography Bonanza",
    description: "Book 2 events, get 1 free pre-wedding shoot",
    discount: "BOGO",
    validUntil: "Jan 15, 2025",
    image: offerPhotography,
    category: "Photography"
  },
  {
    id: "3",
    title: "Venue Booking Offer",
    description: "Flat ₹10,000 off on premium venues",
    discount: "₹10K OFF",
    validUntil: "Dec 25, 2024",
    image: offerVenue,
    category: "Venues"
  },
  {
    id: "4",
    title: "Decoration Delight",
    description: "30% off on themed decoration packages",
    discount: "30% OFF",
    validUntil: "Jan 10, 2025",
    image: offerDecoration,
    category: "Decoration"
  },
  {
    id: "5",
    title: "Live Entertainment Deal",
    description: "Book live band + DJ combo at special rates",
    discount: "40% OFF",
    validUntil: "Jan 20, 2025",
    image: offerEntertainment,
    category: "Entertainment"
  },
  {
    id: "6",
    title: "Designer Cake Package",
    description: "Premium wedding cake with free tasting session",
    discount: "FREE TASTING",
    validUntil: "Feb 14, 2025",
    image: offerCake,
    category: "Cake & Desserts"
  },
];

export const OffersCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Special Offers</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Swipe to explore
          </span>
          <div className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4 text-muted-foreground animate-pulse" />
            <ChevronRight className="h-4 w-4 text-muted-foreground animate-pulse" />
          </div>
        </div>
      </div>
      
      <div className="relative">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {offers.map((offer, index) => (
              <CarouselItem 
                key={offer.id} 
                className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3"
              >
                <Card 
                  className={cn(
                    "glass overflow-hidden border-0 cursor-pointer group transition-all duration-300",
                    "hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                  )}
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={offer.image}
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground border-0 shadow-lg text-base px-3 py-1 animate-pulse">
                      {offer.discount}
                    </Badge>
                    <Badge variant="outline" className="absolute top-3 right-3 glass text-white border-white/20">
                      {offer.category}
                    </Badge>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-bold text-lg mb-1">{offer.title}</h3>
                      <p className="text-sm text-white/90 mb-2 line-clamp-2">{offer.description}</p>
                      <div className="flex items-center gap-1 text-xs text-white/80">
                        <Clock className="h-3 w-3" />
                        <span>Valid until {offer.validUntil}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation Arrows - Hidden on mobile, visible on larger screens */}
          <CarouselPrevious className="hidden md:flex glass border-0 shadow-lg -left-4 hover:bg-primary hover:text-primary-foreground transition-colors" />
          <CarouselNext className="hidden md:flex glass border-0 shadow-lg -right-4 hover:bg-primary hover:text-primary-foreground transition-colors" />
        </Carousel>
        
        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                current === index 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Slide Counter */}
        <div className="absolute -bottom-1 right-0 text-xs text-muted-foreground">
          {current + 1} / {count}
        </div>
      </div>
    </div>
  );
};

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Clock } from "lucide-react";

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
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80",
    category: "Catering"
  },
  {
    id: "2",
    title: "Photography Bonanza",
    description: "Book 2 events, get 1 free pre-wedding shoot",
    discount: "BOGO",
    validUntil: "Jan 15, 2025",
    image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80",
    category: "Photography"
  },
  {
    id: "3",
    title: "Venue Booking Offer",
    description: "Flat ₹10,000 off on premium venues",
    discount: "₹10K OFF",
    validUntil: "Dec 25, 2024",
    image: "https://images.unsplash.com/photo-1519167758481-83f29da8a1c0?w=800&q=80",
    category: "Venues"
  },
  {
    id: "4",
    title: "Decoration Delight",
    description: "30% off on themed decoration packages",
    discount: "30% OFF",
    validUntil: "Jan 10, 2025",
    image: "https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=80",
    category: "Decoration"
  },
];

export const OffersCarousel = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Special Offers</h2>
        </div>
        <div className="h-1 flex-1 ml-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full"></div>
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {offers.map((offer) => (
            <CarouselItem key={offer.id} className="md:basis-1/2 lg:basis-1/3">
              <Card className="glass glass-hover overflow-hidden border-0 cursor-pointer group">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={offer.image}
                    alt={offer.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground border-0 shadow-lg text-base px-3 py-1">
                    {offer.discount}
                  </Badge>
                  <Badge variant="outline" className="absolute top-3 right-3 glass text-white border-white/20">
                    {offer.category}
                  </Badge>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-lg mb-1">{offer.title}</h3>
                    <p className="text-sm text-white/90 mb-2">{offer.description}</p>
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
        <CarouselPrevious className="glass border-0 shadow-lg" />
        <CarouselNext className="glass border-0 shadow-lg" />
      </Carousel>
    </div>
  );
};

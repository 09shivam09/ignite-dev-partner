import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, Clock } from "lucide-react";
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

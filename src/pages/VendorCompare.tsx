import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Star, MapPin, Check, X, MessageCircle, Calendar } from "lucide-react";
import vendorPhotographer from "@/assets/vendor-photographer.jpg";
import vendorCatering from "@/assets/vendor-catering.jpg";
import vendorVenue from "@/assets/vendor-venue.jpg";

const mockVendors = [
  {
    id: "1",
    name: "Elite Photography",
    category: "Photography",
    rating: 4.9,
    reviews: 245,
    price: "₹25,000",
    location: "Mumbai",
    image: vendorPhotographer,
    features: {
      "Experience": "10+ years",
      "Team Size": "5-8 people",
      "Equipment": "Professional Grade",
      "Editing Time": "7-10 days",
      "Raw Photos": true,
      "Video Service": true,
      "Drone Coverage": true,
      "Same Day Edit": false,
      "Albums Included": true,
      "Cancellation": "Flexible"
    }
  },
  {
    id: "2",
    name: "Royal Caterers",
    category: "Catering",
    rating: 4.8,
    reviews: 380,
    price: "₹15,000",
    location: "Mumbai",
    image: vendorCatering,
    features: {
      "Experience": "15+ years",
      "Team Size": "20+ people",
      "Equipment": "Commercial Grade",
      "Editing Time": "N/A",
      "Raw Photos": false,
      "Video Service": false,
      "Drone Coverage": false,
      "Same Day Edit": false,
      "Albums Included": false,
      "Cancellation": "Moderate"
    }
  },
  {
    id: "3",
    name: "Grand Banquet Hall",
    category: "Venues",
    rating: 4.7,
    reviews: 156,
    price: "₹50,000",
    location: "Mumbai",
    image: vendorVenue,
    features: {
      "Experience": "8 years",
      "Team Size": "10-15 people",
      "Equipment": "In-house Sound/Lights",
      "Editing Time": "N/A",
      "Raw Photos": false,
      "Video Service": true,
      "Drone Coverage": false,
      "Same Day Edit": false,
      "Albums Included": false,
      "Cancellation": "Strict"
    }
  }
];

const VendorCompare = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorIds = searchParams.get("vendors")?.split(",") || ["1", "2"];
  
  const [selectedVendors] = useState(
    mockVendors.filter(v => vendorIds.includes(v.id)).slice(0, 3)
  );

  if (selectedVendors.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">No vendors to compare</h2>
          <p className="text-muted-foreground mb-6">
            Select at least 2 vendors from search results to compare them
          </p>
          <Button onClick={() => navigate("/search")}>
            Browse Vendors
          </Button>
        </div>
      </AppLayout>
    );
  }

  const renderValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-red-500 mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <AppLayout>
      <SEOHead 
        title="Compare Vendors - EVENT-CONNECT"
        description="Compare vendors side-by-side to find the perfect match for your event. See pricing, features, and reviews in one place."
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Compare Vendors</h1>
          <p className="text-muted-foreground">
            Side-by-side comparison to help you make the best choice
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vendor Cards */}
          {selectedVendors.map((vendor) => (
            <Card key={vendor.id} className="overflow-hidden">
              <img 
                src={vendor.image} 
                alt={vendor.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-xl mb-1">{vendor.name}</h3>
                  <Badge variant="secondary" className="mb-3">
                    {vendor.category}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-semibold">{vendor.rating}</span>
                    </div>
                    <span className="text-muted-foreground">
                      ({vendor.reviews} reviews)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {vendor.location}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-2xl font-bold text-primary">
                    {vendor.price}
                  </div>
                  <p className="text-xs text-muted-foreground">Starting price</p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/booking/${vendor.id}`)}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Book
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/chat/${vendor.id}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="mt-8 overflow-hidden">
          <div className="p-5">
            <h2 className="text-xl font-bold mb-4">Feature Comparison</h2>
            
            <div className="space-y-3">
              {Object.keys(selectedVendors[0].features).map((feature) => (
                <div key={feature}>
                  <div className="grid grid-cols-4 gap-4 items-center py-3">
                    <div className="font-medium text-sm">{feature}</div>
                    {selectedVendors.map((vendor) => (
                      <div key={vendor.id} className="text-center">
                        {renderValue(vendor.features[feature as keyof typeof vendor.features])}
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="mt-6 flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/search")}
          >
            Compare More Vendors
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default VendorCompare;

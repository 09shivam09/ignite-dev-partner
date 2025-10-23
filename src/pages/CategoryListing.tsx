import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Grid3x3, List } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockVendors = [
  { id: 1, name: "Elite Catering Co", rating: 4.9, price: "$500+", distance: "2.3 km", image: "" },
  { id: 2, name: "Gourmet Events", rating: 4.8, price: "$450+", distance: "3.1 km", image: "" },
  { id: 3, name: "Premium Catering", rating: 4.7, price: "$600+", distance: "1.5 km", image: "" },
  { id: 4, name: "Deluxe Food Services", rating: 4.9, price: "$550+", distance: "4.2 km", image: "" },
];

const CategoryListing = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("rating");

  const categoryName = categoryId?.charAt(0).toUpperCase() + categoryId?.slice(1);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">{categoryName}</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="distance">Nearest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          {mockVendors.length} vendors available
        </p>

        <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"}>
          {mockVendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => navigate(`/vendor/${vendor.id}`)}
              className="bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <div className={viewMode === "grid" ? "h-32" : "h-48 w-full"}>
                <div className="h-full bg-muted"></div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-foreground mb-1">{vendor.name}</h3>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-accent">⭐ {vendor.rating}</span>
                  <span className="text-muted-foreground">{vendor.distance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Starting at</span>
                  <span className="font-semibold text-foreground">{vendor.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CategoryListing;

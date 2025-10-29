import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Search as SearchIcon, SlidersHorizontal, Map } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorMap } from "@/components/VendorMap";
import { VoiceSearch } from "@/components/VoiceSearch";
import { motion } from "framer-motion";

const categories = ["Catering", "Photography", "Venues", "Decoration", "Entertainment", "Supplies"];
const ratings = [5, 4, 3, 2, 1];

const mockVendors = [
  { 
    id: "1", 
    business_name: "Elite Catering Co", 
    name: "Elite Catering Co",
    category: "Catering", 
    rating: 4.9, 
    price: "$500+", 
    image: "",
    location: { latitude: 28.6139, longitude: 77.2090 }
  },
  { 
    id: "2", 
    business_name: "Perfect Moments Photo", 
    name: "Perfect Moments Photo",
    category: "Photography", 
    rating: 4.8, 
    price: "$300+", 
    image: "",
    location: { latitude: 28.6229, longitude: 77.2200 }
  },
  { 
    id: "3", 
    business_name: "Grand Event Hall", 
    name: "Grand Event Hall",
    category: "Venues", 
    rating: 4.7, 
    price: "$1000+", 
    image: "",
    location: { latitude: 28.6049, longitude: 77.1980 }
  },
];

const Search = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("rating");

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center p-4 space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="relative flex-1 flex items-center gap-2">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
            <VoiceSearch
              onResult={(transcript) => setSearchQuery(transcript)}
              className="relative"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <Label className="text-base font-semibold mb-4 block">Categories</Label>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <label htmlFor={category} className="text-sm cursor-pointer">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={5000}
                    step={100}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block">Minimum Rating</Label>
                  <div className="space-y-2">
                    {ratings.map((rating) => (
                      <Button
                        key={rating}
                        variant={selectedRating === rating ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedRating(rating)}
                      >
                        {"⭐".repeat(rating)} {rating}+ Stars
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedCategories([]);
                    setPriceRange([0, 5000]);
                    setSelectedRating(null);
                  }}
                  variant="outline"
                >
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="px-4 pb-4">
          <Tabs defaultValue="list">
            <div className="flex items-center gap-2">
              <TabsList>
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="map">
                  <Map className="h-4 w-4 mr-1" />
                  Map
                </TabsTrigger>
              </TabsList>
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

            <TabsContent value="list" className="mt-4">
              <main className="p-4 space-y-4">
                {mockVendors.map((vendor, index) => (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/vendor/${vendor.id}`)}
                    className="bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover-lift tap-effect"
                  >
                    <div className="h-48 bg-muted"></div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                          <p className="text-sm text-muted-foreground">{vendor.category}</p>
                        </div>
                        <span className="text-accent font-medium">⭐ {vendor.rating}</span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm text-muted-foreground">Starting at</span>
                        <span className="font-semibold text-foreground">{vendor.price}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </main>
            </TabsContent>

            <TabsContent value="map" className="mt-4 px-4">
              <VendorMap 
                vendors={mockVendors}
                center={{ lat: 28.6139, lng: 77.2090 }}
                zoom={12}
              />
            </TabsContent>
          </Tabs>
        </div>
      </header>
    </div>
  );
};

export default Search;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Star, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([
    { id: "1", name: "Elite Photography", category: "Photography", rating: 4.8, reviews: 127, location: "New York", price: "$2,500", image: "photography" },
    { id: "2", name: "Gourmet Catering Co.", category: "Catering", rating: 4.9, reviews: 203, location: "Los Angeles", price: "$850", image: "catering" },
    { id: "3", name: "Dream Decorators", category: "Decoration", rating: 4.7, reviews: 98, location: "Chicago", price: "$1,200", image: "decoration" },
  ]);

  const handleRemoveFavorite = (id: string, name: string) => {
    setFavorites(favorites.filter(f => f.id !== id));
    toast.success(`${name} removed from favorites`);
  };

  const renderVendor = (vendor: typeof favorites[0]) => (
    <Card key={vendor.id} className="overflow-hidden">
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <span className="text-4xl">📸</span>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-card/80"
          onClick={() => handleRemoveFavorite(vendor.id, vendor.name)}
        >
          <Heart className="h-5 w-5 fill-destructive text-destructive" />
        </Button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1">{vendor.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{vendor.category}</p>
        
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span>{vendor.rating}</span>
            <span className="text-muted-foreground">({vendor.reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{vendor.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-accent">{vendor.price}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/chat/${vendor.id}`)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/vendor/${vendor.id}`)}
            >
              View
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-6">
        <h1 className="text-2xl font-bold text-white mb-1">My Favorites</h1>
        <p className="text-white/80">{favorites.length} saved vendors</p>
      </div>

      <div className="p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="photography">Photo</TabsTrigger>
            <TabsTrigger value="catering">Food</TabsTrigger>
            <TabsTrigger value="decoration">Decor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4 space-y-4">
            {favorites.map(renderVendor)}
          </TabsContent>
          
          <TabsContent value="photography" className="mt-4 space-y-4">
            {favorites.filter(v => v.category === "Photography").map(renderVendor)}
          </TabsContent>
          
          <TabsContent value="catering" className="mt-4 space-y-4">
            {favorites.filter(v => v.category === "Catering").map(renderVendor)}
          </TabsContent>
          
          <TabsContent value="decoration" className="mt-4 space-y-4">
            {favorites.filter(v => v.category === "Decoration").map(renderVendor)}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Favorites;

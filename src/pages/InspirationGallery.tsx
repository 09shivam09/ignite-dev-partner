import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, BookmarkPlus, Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import portfolioCatering1 from "@/assets/portfolio-catering-1.jpg";
import portfolioCatering2 from "@/assets/portfolio-catering-2.jpg";
import portfolioDecoration1 from "@/assets/portfolio-decoration-1.jpg";
import portfolioDecoration2 from "@/assets/portfolio-decoration-2.jpg";

const inspirationItems = [
  {
    id: 1,
    title: "Elegant Garden Wedding",
    category: "wedding",
    image: portfolioDecoration1,
    likes: 1245,
    views: 5670,
    tags: ["outdoor", "elegant", "floral"],
    vendor: "Elite Decorators",
    budget: "₹2,50,000"
  },
  {
    id: 2,
    title: "Royal Sangeet Ceremony",
    category: "wedding",
    image: portfolioDecoration2,
    likes: 2100,
    views: 8900,
    tags: ["traditional", "luxury", "colorful"],
    vendor: "Royal Events",
    budget: "₹3,50,000"
  },
  {
    id: 3,
    title: "Gourmet Food Stations",
    category: "corporate",
    image: portfolioCatering1,
    likes: 890,
    views: 3200,
    tags: ["modern", "fusion", "premium"],
    vendor: "Royal Caterers",
    budget: "₹1,50,000"
  },
  {
    id: 4,
    title: "Vintage Birthday Bash",
    category: "birthday",
    image: portfolioCatering2,
    likes: 650,
    views: 2400,
    tags: ["vintage", "theme", "desserts"],
    vendor: "Sweet Celebrations",
    budget: "₹75,000"
  }
];

const InspirationGallery = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [likedItems, setLikedItems] = useState<number[]>([]);
  const [savedItems, setSavedItems] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("gallery");

  // Load saved items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('moodboard');
    if (saved) {
      setSavedItems(JSON.parse(saved));
    }
  }, []);

  const filteredItems = selectedCategory === "all" 
    ? inspirationItems 
    : inspirationItems.filter(item => item.category === selectedCategory);

  const handleLike = (id: number) => {
    setLikedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    toast({
      description: likedItems.includes(id) ? "Removed from likes" : "Added to likes",
    });
  };

  const handleSave = (id: number) => {
    const newSavedItems = savedItems.includes(id) 
      ? savedItems.filter(i => i !== id) 
      : [...savedItems, id];
    
    setSavedItems(newSavedItems);
    localStorage.setItem('moodboard', JSON.stringify(newSavedItems));
    
    toast({
      description: savedItems.includes(id) ? "Removed from moodboard" : "Saved to moodboard ✨",
    });
  };

  const handleShare = (title: string) => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Check out this amazing event inspiration: ${title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ description: "Link copied to clipboard" });
    }
  };

  return (
    <AppLayout>
      <SEOHead 
        title="Event Inspiration Gallery - EVENT-CONNECT"
        description="Browse thousands of real event photos and get inspired for your next celebration. Discover trending themes, decor ideas, and vendor portfolios."
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Inspiration Gallery</h1>
          <p className="text-muted-foreground">
            Discover stunning event ideas and real celebrations to inspire your next event
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="moodboard">
              My Moodboard ({savedItems.length})
            </TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6 mt-6">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["all", "wedding", "birthday", "corporate"].map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === "all" ? "All Events" : `${category}s`}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <div className="relative">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleLike(item.id)}
                        className={likedItems.includes(item.id) ? "text-red-500" : ""}
                      >
                        <Heart className={`h-5 w-5 ${likedItems.includes(item.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleSave(item.id)}
                        className={savedItems.includes(item.id) ? "text-accent" : ""}
                      >
                        <BookmarkPlus className={`h-5 w-5 ${savedItems.includes(item.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleShare(item.title)}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Stats Badge */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm">
                        <Heart className="h-3 w-3 mr-1" />
                        {item.likes}
                      </Badge>
                      <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm">
                        <Eye className="h-3 w-3 mr-1" />
                        {item.views}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">by {item.vendor}</p>
                        <p className="font-semibold text-primary">{item.budget}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/vendor/${item.id}`)}
                      >
                        View Vendor
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Moodboard Tab */}
          <TabsContent value="moodboard" className="space-y-6 mt-6">
            {savedItems.length === 0 ? (
              <Card className="p-12 text-center">
                <BookmarkPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-bold mb-2">Your moodboard is empty</h3>
                <p className="text-muted-foreground mb-4">
                  Start saving inspiration from the gallery to create your perfect event vision
                </p>
                <Button onClick={() => setActiveTab("gallery")}>
                  Browse Gallery
                </Button>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inspirationItems.filter(item => savedItems.includes(item.id)).map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="relative">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => handleSave(item.id)}
                            className="text-accent"
                          >
                            <BookmarkPlus className="h-5 w-5 fill-current" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold mb-2">{item.title}</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">{item.vendor}</p>
                          <p className="font-semibold text-primary">{item.budget}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Moodboard
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => handleShare("My Moodboard")}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Moodboard
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default InspirationGallery;

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Theme {
  id: string;
  name: string;
  description: string;
  popularity: string;
  image: string;
}

const themes: Theme[] = [
  {
    id: "rustic",
    name: "Rustic Elegance",
    description: "Natural wood & earthy tones",
    popularity: "+45%",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&q=80"
  },
  {
    id: "modern",
    name: "Modern Minimalist",
    description: "Clean lines & neutral palette",
    popularity: "+38%",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80"
  },
  {
    id: "vintage",
    name: "Vintage Romance",
    description: "Classic charm & timeless beauty",
    popularity: "+32%",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80"
  },
  {
    id: "tropical",
    name: "Tropical Paradise",
    description: "Vibrant colors & exotic florals",
    popularity: "+29%",
    image: "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=400&q=80"
  },
];

export const TrendingThemes = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold">Trending Themes</h2>
        </div>
        <div className="h-1 flex-1 ml-4 bg-gradient-to-r from-accent/20 to-transparent rounded-full"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themes.map((theme, index) => (
          <Card
            key={theme.id}
            onClick={() => navigate(`/search?theme=${theme.id}`)}
            className="glass glass-hover cursor-pointer overflow-hidden border-0 group animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative h-40 overflow-hidden">
              <img
                src={theme.image}
                alt={theme.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground border-0 shadow-lg">
                <TrendingUp className="h-3 w-3 mr-1" />
                {theme.popularity}
              </Badge>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                {theme.name}
              </h3>
              <p className="text-sm text-muted-foreground">{theme.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

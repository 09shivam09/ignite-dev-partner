import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import themeRustic from "@/assets/theme-rustic.jpg";
import themeModern from "@/assets/theme-modern.jpg";
import themeVintage from "@/assets/theme-vintage.jpg";
import themeTropical from "@/assets/theme-tropical.jpg";

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
    image: themeRustic
  },
  {
    id: "modern",
    name: "Modern Minimalist",
    description: "Clean lines & neutral palette",
    popularity: "+38%",
    image: themeModern
  },
  {
    id: "vintage",
    name: "Vintage Romance",
    description: "Classic charm & timeless beauty",
    popularity: "+32%",
    image: themeVintage
  },
  {
    id: "tropical",
    name: "Tropical Paradise",
    description: "Vibrant colors & exotic florals",
    popularity: "+29%",
    image: themeTropical
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

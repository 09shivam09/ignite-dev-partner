import { useNavigate } from "react-router-dom";
import { OptimizedImage } from "./OptimizedImage";
import cateringImg from "@/assets/category-catering.jpg";
import photographyImg from "@/assets/category-photography.jpg";
import venuesImg from "@/assets/category-venues.jpg";
import decorationImg from "@/assets/category-decoration.jpg";
import entertainmentImg from "@/assets/category-entertainment.jpg";
import suppliesImg from "@/assets/category-supplies.jpg";
import cooksImg from "@/assets/category-cooks-chefs.jpg";
import bartendersImg from "@/assets/category-bartenders.jpg";
import waitersImg from "@/assets/category-waiters.jpg";
import cleanersImg from "@/assets/category-cleaners.jpg";
import ingredientDeliveryImg from "@/assets/category-ingredient-delivery.jpg";
import partyDecoratorsImg from "@/assets/category-party-decorators.jpg";
import singersImg from "@/assets/category-singers.jpg";
import cakeArtistsImg from "@/assets/category-cake-artists.jpg";

interface Category {
  id: string;
  name: string;
  image: string;
}

const categories: Category[] = [
  { id: "catering", name: "Catering", image: cateringImg },
  { id: "photography", name: "Photography", image: photographyImg },
  { id: "venues", name: "Venues", image: venuesImg },
  { id: "decoration", name: "Decoration", image: decorationImg },
  { id: "entertainment", name: "Entertainment", image: entertainmentImg },
  { id: "supplies", name: "Supplies", image: suppliesImg },
  { id: "cooks-chefs", name: "Cooks & Chefs", image: cooksImg },
  { id: "bartenders", name: "Bartenders", image: bartendersImg },
  { id: "waiters", name: "Waiters", image: waitersImg },
  { id: "cleaners", name: "Cleaners", image: cleanersImg },
  { id: "ingredient-delivery", name: "Ingredient Delivery", image: ingredientDeliveryImg },
  { id: "party-decorators", name: "Party Decorators", image: partyDecoratorsImg },
  { id: "singers", name: "Singers", image: singersImg },
  { id: "cake-artists", name: "Cake Artists", image: cakeArtistsImg },
];

export const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category, index) => (
        <button
          key={category.id}
          onClick={() => navigate(`/category/${category.id}`)}
          className="glass glass-hover rounded-2xl overflow-hidden transition-all shadow-md group animate-scale-in relative aspect-square"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <OptimizedImage
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <span className="absolute bottom-4 left-0 right-0 text-center text-sm font-semibold text-white px-2 group-hover:text-primary-foreground transition-colors">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  );
};

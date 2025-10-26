import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: "catering", name: "Catering", icon: "🍽️" },
  { id: "photography", name: "Photography", icon: "📸" },
  { id: "venues", name: "Venues", icon: "🏛️" },
  { id: "decoration", name: "Decoration", icon: "🎨" },
  { id: "entertainment", name: "Entertainment", icon: "🎭" },
  { id: "supplies", name: "Supplies", icon: "📦" },
];

export const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-4">
      {categories.map((category, index) => (
        <button
          key={category.id}
          onClick={() => navigate(`/category/${category.id}`)}
          className="glass glass-hover rounded-2xl p-6 transition-all shadow-md group animate-scale-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
          <span className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">{category.name}</span>
        </button>
      ))}
    </div>
  );
};

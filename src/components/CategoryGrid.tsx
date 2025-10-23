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
    <div className="grid grid-cols-3 gap-4 p-6">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => navigate(`/category/${category.id}`)}
          className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-card p-4 transition-all hover:scale-105 hover:shadow-lg border border-border"
        >
          <div className="text-4xl">{category.icon}</div>
          <span className="text-sm font-medium text-card-foreground">{category.name}</span>
        </button>
      ))}
    </div>
  );
};

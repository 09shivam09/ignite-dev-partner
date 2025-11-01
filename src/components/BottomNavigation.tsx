import { useNavigate, useLocation } from "react-router-dom";
import { Home, Grid3x3, Calendar, MessageCircle, User, Users, Vote } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/feed", icon: Users, label: "Feed" },
  { path: "/dao", icon: Vote, label: "DAO" },
  { path: "/bookings", icon: Calendar, label: "Bookings" },
  { path: "/profile", icon: User, label: "Profile" },
];

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition-colors ${
                isActive ? "text-accent" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "fill-accent" : ""}`} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

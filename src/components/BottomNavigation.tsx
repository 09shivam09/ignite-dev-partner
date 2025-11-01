import { useNavigate, useLocation } from "react-router-dom";
import { Home, Grid3x3, Calendar, MessageCircle, User, Users, Scale } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home", ariaLabel: "Navigate to home page" },
  { path: "/feed", icon: Users, label: "Feed", ariaLabel: "View community feed" },
  { path: "/dao", icon: Scale, label: "DAO", ariaLabel: "Access DAO governance" },
  { path: "/bookings", icon: Calendar, label: "Bookings", ariaLabel: "Manage your bookings" },
  { path: "/profile", icon: User, label: "Profile", ariaLabel: "View your profile" },
];

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = (e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(path);
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              onKeyDown={(e) => handleKeyDown(e, item.path)}
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition-colors ${
                isActive ? "text-accent" : "text-muted-foreground"
              }`}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              tabIndex={0}
            >
              <Icon className={`h-5 w-5 ${isActive ? "fill-accent" : ""}`} aria-hidden="true" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users, Scale, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "Home", emoji: "🏠" },
  { path: "/feed", icon: Users, label: "Feed", emoji: "👥" },
  { path: "/dao", icon: Scale, label: "DAO", emoji: "⚖️" },
  { path: "/bookings", icon: Calendar, label: "Bookings", emoji: "📅" },
  { path: "/profile", icon: User, label: "Profile", emoji: "👤" },
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
      className="fixed bottom-0 left-0 right-0 z-50"
      role="navigation"
      aria-label="Bottom navigation"
    >
      {/* Gradient blur background */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-xl border-t border-border/40" />
      
      {/* Navigation content */}
      <div className="relative flex justify-around items-center h-20 px-2 max-w-lg mx-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              onKeyDown={(e) => handleKeyDown(e, item.path)}
              className="relative flex flex-col items-center justify-center flex-1 h-full group"
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? "page" : undefined}
              tabIndex={0}
              whileTap={{ scale: 0.9 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {/* Active indicator - glowing pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-gradient-primary shadow-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              
              {/* Icon container */}
              <motion.div 
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                }`}
                animate={isActive ? { y: -4 } : { y: 0 }}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </motion.div>
              
              {/* Label */}
              <motion.span 
                className={`text-[10px] font-medium mt-0.5 transition-colors duration-300 ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
                animate={isActive ? { y: 2 } : { y: 0 }}
              >
                {item.label}
              </motion.span>

              {/* Hover emoji */}
              <motion.span
                className="absolute -top-6 text-lg opacity-0 group-hover:opacity-100 pointer-events-none"
                initial={false}
                animate={{ 
                  y: isActive ? -4 : 0,
                  opacity: 0
                }}
                whileHover={{ opacity: 1, y: -8 }}
              >
                {item.emoji}
              </motion.span>
            </motion.button>
          );
        })}
      </div>

      {/* Safe area padding for mobile */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
};

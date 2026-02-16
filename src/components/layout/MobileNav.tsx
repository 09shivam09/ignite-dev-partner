/**
 * Mobile top nav bar — only visible on small screens.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Search, Heart, MessageSquare, LogOut, LayoutDashboard } from "lucide-react";

export const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const isVendor = profile?.user_type === "vendor";

  const handleSignOut = async () => {
    await signOut();
    navigate("/marketplace/auth");
  };

  const items = isVendor
    ? [{ icon: LayoutDashboard, path: "/marketplace/vendor/dashboard", label: "Dashboard" }]
    : [
        { icon: Home, path: "/marketplace", label: "Home" },
        { icon: Calendar, path: "/marketplace/events", label: "Events" },
        { icon: Search, path: "/marketplace/vendors", label: "Vendors" },
        { icon: MessageSquare, path: "/marketplace/inquiries", label: "Inquiries" },
        { icon: Heart, path: "/marketplace/saved", label: "Saved" },
      ];

  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 border-b bg-card sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
          E
        </div>
        <span className="font-semibold text-sm">EventConnect</span>
      </div>
      <div className="flex items-center gap-1">
        {items.map((item) => (
          <Button
            key={item.path}
            variant={location.pathname === item.path ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="h-4 w-4" />
          </Button>
        ))}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

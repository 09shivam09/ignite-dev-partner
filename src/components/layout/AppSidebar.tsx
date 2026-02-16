/**
 * Minimal elegant sidebar for authenticated users.
 * Consumer and vendor share the same shell; items differ by role.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home, Calendar, Search, Heart, MessageSquare, LayoutDashboard,
  User, Shield, HelpCircle, LogOut, ChevronLeft, ChevronRight,
  Sun, Moon
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const CONSUMER_NAV: NavItem[] = [
  { label: "Home", icon: Home, path: "/marketplace" },
  { label: "My Events", icon: Calendar, path: "/marketplace/events" },
  { label: "Find Vendors", icon: Search, path: "/marketplace/vendors" },
  { label: "Inquiries", icon: MessageSquare, path: "/marketplace/inquiries" },
  { label: "Saved", icon: Heart, path: "/marketplace/saved" },
];

const VENDOR_NAV: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/marketplace/vendor/dashboard" },
];

export const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();

  const isVendor = profile?.user_type === "vendor";
  const navItems = isVendor ? VENDOR_NAV : CONSUMER_NAV;

  const handleSignOut = async () => {
    await signOut();
    navigate("/marketplace/auth");
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 h-16 border-b border-sidebar-border", collapsed && "justify-center")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
          E
        </div>
        {!collapsed && (
          <span className="font-semibold text-sidebar-foreground text-sm">EventConnect</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {!collapsed && (
          <p className="section-label px-3 pb-2">Navigation</p>
        )}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all",
            collapsed && "justify-center px-0"
          )}
        >
          {theme === "dark" ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-lg py-2 text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};

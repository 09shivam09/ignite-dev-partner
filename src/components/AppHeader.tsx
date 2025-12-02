import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun, Bell, User, LogOut, Sparkles, Heart } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WalletStatus } from "@/components/web3/WalletStatus";
import { NetworkSwitchPrompt } from "@/components/web3/NetworkSwitchPrompt";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const AppHeader = () => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    } else {
      navigate("/auth/login");
    }
  };

  const navItems = [
    { label: "Home", path: "/", emoji: "🏠" },
    { label: "Search", path: "/search", emoji: "🔍" },
    { label: "My Bookings", path: "/my-bookings", emoji: "📅" },
    { label: "Favorites", path: "/favorites", emoji: "💖" },
    { label: "Messages", path: "/chat", emoji: "💬" },
  ];

  return (
    <>
      <NetworkSwitchPrompt />
      <motion.header 
        className="sticky top-0 z-50 w-full"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Gradient background with blur */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 backdrop-blur-xl border-b border-border/40" />
        
        <div className="relative container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div 
              className="relative h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-5 w-5 text-white" />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-primary blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            </motion.div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary via-accent to-love bg-clip-text text-transparent">
                EventConnect
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1">Plan with love 💜</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-primary/5 group"
                >
                  <span className="relative z-10">{item.label}</span>
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                    {item.emoji}
                  </span>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            {/* Wallet Status */}
            <WalletStatus />
            
            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hidden sm:flex relative rounded-xl hover:bg-primary/10"
              >
                <AnimatePresence mode="wait">
                  {theme === "dark" ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-5 w-5 text-amber-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-5 w-5 text-indigo-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            {/* Notifications */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/notifications")}
                className="hidden sm:flex relative rounded-xl hover:bg-primary/10"
              >
                <Bell className="h-5 w-5" />
                {/* Notification dot */}
                <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-accent to-love rounded-full animate-pulse" />
              </Button>
            </motion.div>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-primary/10">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 glass">
                <DropdownMenuItem 
                  onClick={() => navigate("/profile")}
                  className="rounded-lg cursor-pointer hover:bg-primary/10"
                >
                  <User className="mr-3 h-4 w-4 text-primary" />
                  <span>Profile</span>
                  <span className="ml-auto">👤</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/favorites")}
                  className="rounded-lg cursor-pointer hover:bg-love/10"
                >
                  <Heart className="mr-3 h-4 w-4 text-love" />
                  <span>Favorites</span>
                  <span className="ml-auto">💖</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/notifications")}
                  className="rounded-lg cursor-pointer hover:bg-accent/10"
                >
                  <Bell className="mr-3 h-4 w-4 text-accent" />
                  <span>Notifications</span>
                  <span className="ml-auto">🔔</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="sm:hidden rounded-lg cursor-pointer"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-3 h-4 w-4 text-amber-500" />
                      <span>Light Mode</span>
                      <span className="ml-auto">☀️</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-3 h-4 w-4 text-indigo-500" />
                      <span>Dark Mode</span>
                      <span className="ml-auto">🌙</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="sm:hidden my-2" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="rounded-lg cursor-pointer text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Logout</span>
                  <span className="ml-auto">👋</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </motion.div>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] glass border-l-0">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center gap-3 py-6 border-b border-border/40">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">EventConnect</h2>
                      <p className="text-xs text-muted-foreground">Plan with love 💜</p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex flex-col space-y-2 mt-6 flex-1">
                    {navItems.map((item, index) => (
                      <motion.div
                        key={item.path}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.path}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-4 px-4 py-3 rounded-xl text-base font-medium transition-colors hover:bg-primary/10 group"
                        >
                          <span className="text-xl group-hover:animate-wiggle">{item.emoji}</span>
                          <span>{item.label}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </nav>

                  {/* Footer */}
                  <div className="py-6 border-t border-border/40">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                      <span className="ml-auto">👋</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>
    </>
  );
};

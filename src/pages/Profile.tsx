import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, MapPin, Phone, Mail, CreditCard, Bell, 
  HelpCircle, Shield, LogOut, ChevronRight, Edit 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: User, label: "Edit Profile", path: "/profile/edit" },
    { icon: MapPin, label: "Saved Addresses", path: "/profile/addresses" },
    { icon: CreditCard, label: "Payment Methods", path: "/profile/payment-methods" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: HelpCircle, label: "Help & Support", path: "/profile/help" },
    { icon: Shield, label: "Privacy & Security", path: "/profile/privacy" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent p-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* User Info Card */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{profile?.full_name || 'User'}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Mail className="h-4 w-4" />
                <span>{profile?.email || 'No email'}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile/edit")}
            >
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">12</div>
              <div className="text-xs text-muted-foreground">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">8</div>
              <div className="text-xs text-muted-foreground">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">5</div>
              <div className="text-xs text-muted-foreground">Reviews</div>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <Card className="divide-y divide-border">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 p-4 w-full hover:bg-card-foreground/5 transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </Card>

        {/* Logout Button */}
        <Button variant="destructive" className="w-full" size="lg" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;

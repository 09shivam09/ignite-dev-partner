import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

interface MarketplaceProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'vendor')[];
}

export const MarketplaceProtectedRoute = ({ 
  children, 
  allowedRoles 
}: MarketplaceProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          setUserType(profile?.user_type || null);
        } else {
          setUserType(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        setUserType(profile?.user_type || null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/marketplace/auth" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && userType && !allowedRoles.includes(userType as 'user' | 'vendor')) {
    // Redirect to appropriate dashboard based on role
    if (userType === 'vendor') {
      return <Navigate to="/marketplace/vendor/dashboard" replace />;
    } else {
      return <Navigate to="/marketplace" replace />;
    }
  }

  return <>{children}</>;
};

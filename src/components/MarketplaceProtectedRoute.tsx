import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface MarketplaceProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('consumer' | 'vendor')[];
}

export const MarketplaceProtectedRoute = ({ 
  children, 
  allowedRoles 
}: MarketplaceProtectedRouteProps) => {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

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
  const userType = profile?.user_type;
  if (allowedRoles && userType && !allowedRoles.includes(userType as 'consumer' | 'vendor')) {
    // Redirect to appropriate dashboard based on role
    if (userType === 'vendor') {
      return <Navigate to="/marketplace/vendor/dashboard" replace />;
    } else {
      return <Navigate to="/marketplace" replace />;
    }
  }

  return <>{children}</>;
};

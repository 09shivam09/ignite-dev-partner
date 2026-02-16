import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MarketplaceProtectedRoute } from "./components/MarketplaceProtectedRoute";
import { ThemeProvider } from "./components/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider } from "@/hooks/useAuth";

// Marketplace pages
const MarketplaceAuth = lazy(() => import("./pages/marketplace/AuthPage"));
const MarketplaceUserHome = lazy(() => import("./pages/marketplace/UserHome"));
const MarketplaceCreateEvent = lazy(() => import("./pages/marketplace/CreateEvent"));
const MarketplaceVendorDiscovery = lazy(() => import("./pages/marketplace/VendorDiscovery"));
const MarketplaceVendorOnboarding = lazy(() => import("./pages/marketplace/VendorOnboarding"));
const MarketplaceVendorDashboard = lazy(() => import("./pages/marketplace/VendorDashboardPage"));
const MarketplaceVendorDetail = lazy(() => import("./pages/marketplace/VendorDetailPage"));
const MarketplaceUserInquiries = lazy(() => import("./pages/marketplace/UserInquiries"));
const MarketplaceUserEvents = lazy(() => import("./pages/marketplace/UserEvents"));
const MarketplaceUserSavedVendors = lazy(() => import("./pages/marketplace/UserSavedVendors"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="w-full max-w-md space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/marketplace/auth" replace />} />
                  
                  <Route path="/marketplace/auth" element={<MarketplaceAuth />} />
                  <Route path="/marketplace" element={<MarketplaceProtectedRoute allowedRoles={['consumer']}><MarketplaceUserHome /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/events/create" element={<MarketplaceProtectedRoute allowedRoles={['consumer']}><MarketplaceCreateEvent /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/vendors" element={<MarketplaceProtectedRoute allowedRoles={['consumer']}><MarketplaceVendorDiscovery /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/events/:eventId/vendors" element={<MarketplaceProtectedRoute allowedRoles={['consumer']}><MarketplaceVendorDiscovery /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/inquiries" element={<MarketplaceProtectedRoute allowedRoles={['consumer']}><MarketplaceUserInquiries /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/events" element={<MarketplaceProtectedRoute allowedRoles={['consumer']}><MarketplaceUserEvents /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/saved" element={<MarketplaceProtectedRoute allowedRoles={['consumer']}><MarketplaceUserSavedVendors /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/vendor/onboarding" element={<MarketplaceProtectedRoute allowedRoles={['vendor']}><MarketplaceVendorOnboarding /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/vendor/dashboard" element={<MarketplaceProtectedRoute allowedRoles={['vendor']}><MarketplaceVendorDashboard /></MarketplaceProtectedRoute>} />
                  <Route path="/marketplace/vendor/:vendorId" element={<MarketplaceProtectedRoute><MarketplaceVendorDetail /></MarketplaceProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

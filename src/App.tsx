import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GoogleMapsProvider } from "./components/GoogleMapsProvider";
import { AccessibilityProvider } from "./components/AccessibilityProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { WalletProvider } from "./contexts/WalletContext";
import { Skeleton } from "@/components/ui/skeleton";

// Eager load critical routes
import Index from "./pages/Index";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Lazy load other routes for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Documentation = lazy(() => import("./pages/Documentation"));
const OTPVerification = lazy(() => import("./pages/OTPVerification"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Search = lazy(() => import("./pages/Search"));
const CategoryListing = lazy(() => import("./pages/CategoryListing"));
const VendorDetails = lazy(() => import("./pages/VendorDetails"));
const Booking = lazy(() => import("./pages/Booking"));
const Cart = lazy(() => import("./pages/Cart"));
const Payment = lazy(() => import("./pages/Payment"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const Chat = lazy(() => import("./pages/Chat"));
const ChatDetail = lazy(() => import("./pages/ChatDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Feed = lazy(() => import("./pages/Feed"));
const MintNFT = lazy(() => import("./pages/MintNFT"));
const DAODashboard = lazy(() => import("./pages/dao/DAODashboard"));
const ProposalsList = lazy(() => import("./pages/dao/ProposalsList"));
const ProposalDetails = lazy(() => import("./pages/dao/ProposalDetails"));
const CreateProposal = lazy(() => import("./pages/dao/CreateProposal"));
const DelegateVoting = lazy(() => import("./pages/dao/DelegateVoting"));
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard"));
const VendorOrders = lazy(() => import("./pages/vendor/VendorOrders"));
const VendorServices = lazy(() => import("./pages/vendor/VendorServices"));
const VendorAnalytics = lazy(() => import("./pages/vendor/VendorAnalytics"));
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
        <AccessibilityProvider>
          <WalletProvider>
            <GoogleMapsProvider>
              <CartProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/landing" element={<Landing />} />
                        <Route path="/docs" element={<Documentation />} />
                        <Route path="/splash" element={<Splash />} />
                        <Route path="/onboarding" element={<Onboarding />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/auth/login" element={<Login />} />
                        <Route path="/auth/signup" element={<Signup />} />
                        <Route path="/auth/otp-verification" element={<OTPVerification />} />
                        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                        <Route path="/category/:categoryId" element={<ProtectedRoute><CategoryListing /></ProtectedRoute>} />
                        <Route path="/vendor/:vendorId" element={<ProtectedRoute><VendorDetails /></ProtectedRoute>} />
                        <Route path="/booking/:vendorId" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                        <Route path="/booking-confirmation" element={<ProtectedRoute><BookingConfirmation /></ProtectedRoute>} />
                        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
                        <Route path="/booking-details/:bookingId" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
                        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                        <Route path="/chat/:vendorId" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
                        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                        <Route path="/mint-nft" element={<ProtectedRoute><MintNFT /></ProtectedRoute>} />
                        <Route path="/dao" element={<ProtectedRoute><DAODashboard /></ProtectedRoute>} />
                        <Route path="/dao/proposals" element={<ProtectedRoute><ProposalsList /></ProtectedRoute>} />
                        <Route path="/dao/proposals/create" element={<ProtectedRoute><CreateProposal /></ProtectedRoute>} />
                        <Route path="/dao/proposals/:id" element={<ProtectedRoute><ProposalDetails /></ProtectedRoute>} />
                        <Route path="/dao/delegate" element={<ProtectedRoute><DelegateVoting /></ProtectedRoute>} />
                        <Route path="/vendor/dashboard" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
                        <Route path="/vendor/orders" element={<ProtectedRoute><VendorOrders /></ProtectedRoute>} />
                        <Route path="/vendor/services" element={<ProtectedRoute><VendorServices /></ProtectedRoute>} />
                        <Route path="/vendor/analytics" element={<ProtectedRoute><VendorAnalytics /></ProtectedRoute>} />
                        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
              </CartProvider>
            </GoogleMapsProvider>
          </WalletProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

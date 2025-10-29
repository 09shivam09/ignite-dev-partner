import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

class Analytics {
  private initialized = false;

  initialize() {
    if (GA_MEASUREMENT_ID && !this.initialized) {
      ReactGA.initialize(GA_MEASUREMENT_ID);
      this.initialized = true;
      console.log("Google Analytics initialized");
    }
  }

  // Track page views
  pageView(path: string) {
    if (this.initialized) {
      ReactGA.send({ hitType: "pageview", page: path });
    }
  }

  // Track custom events
  event(category: string, action: string, label?: string, value?: number) {
    if (this.initialized) {
      ReactGA.event({
        category,
        action,
        label,
        value,
      });
    }
  }

  // Track user actions
  trackSearch(searchTerm: string) {
    this.event("Search", "search_query", searchTerm);
  }

  trackVendorView(vendorId: string, vendorName: string) {
    this.event("Vendor", "view_vendor", vendorName);
  }

  trackBookingStarted(vendorId: string, serviceName: string) {
    this.event("Booking", "booking_started", serviceName);
  }

  trackBookingCompleted(bookingId: string, amount: number) {
    this.event("Booking", "booking_completed", bookingId, amount);
  }

  trackPaymentInitiated(amount: number) {
    this.event("Payment", "payment_initiated", undefined, amount);
  }

  trackPaymentCompleted(amount: number) {
    this.event("Payment", "payment_completed", undefined, amount);
  }

  trackCategoryView(category: string) {
    this.event("Category", "view_category", category);
  }

  trackAddToCart(serviceName: string, price: number) {
    this.event("Cart", "add_to_cart", serviceName, price);
  }

  trackReviewSubmitted(vendorId: string, rating: number) {
    this.event("Review", "submit_review", vendorId, rating);
  }

  trackSignup(method: string) {
    this.event("Auth", "sign_up", method);
  }

  trackLogin(method: string) {
    this.event("Auth", "login", method);
  }
}

export const analytics = new Analytics();
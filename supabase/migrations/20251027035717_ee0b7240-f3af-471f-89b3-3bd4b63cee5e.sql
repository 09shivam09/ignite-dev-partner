-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'consumer');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded');
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE public.notification_type AS ENUM ('booking', 'message', 'payment', 'review', 'system', 'promotion');
CREATE TYPE public.vendor_verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- User Roles Table (Security Definer Pattern)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Vendors Table (Catalog Service)
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  location GEOGRAPHY(POINT, 4326),
  logo_url TEXT,
  cover_image_url TEXT,
  verification_status vendor_verification_status DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  service_radius INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_vendors_location ON public.vendors USING GIST(location);
CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);

-- Categories Table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Vendor Services Table (Catalog Service)
CREATE TABLE public.vendor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  pricing_type TEXT DEFAULT 'fixed',
  duration_minutes INTEGER,
  is_available BOOLEAN DEFAULT true,
  max_capacity INTEGER,
  images TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_vendor_services_vendor ON public.vendor_services(vendor_id);
CREATE INDEX idx_vendor_services_category ON public.vendor_services(category_id);

-- Bookings Table (Booking Service)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT UNIQUE NOT NULL,
  consumer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.vendor_services(id),
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT,
  guest_count INTEGER,
  event_address TEXT,
  special_requirements TEXT,
  quantity INTEGER DEFAULT 1,
  base_price DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_bookings_consumer ON public.bookings(consumer_id);
CREATE INDEX idx_bookings_vendor ON public.bookings(vendor_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_event_date ON public.bookings(event_date);

-- Generate booking reference function
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Payments Table (Payment Service)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_provider TEXT,
  transaction_id TEXT UNIQUE,
  status payment_status DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);

-- Reviews Table (Review Service)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  vendor_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(booking_id, consumer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_reviews_vendor ON public.reviews(vendor_id);
CREATE INDEX idx_reviews_consumer ON public.reviews(consumer_id);

-- Messages Table (Messaging Service)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments TEXT[],
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Notifications Table (Notification Service)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Addresses Table (User Profile Service)
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_addresses_user ON public.addresses(user_id);

-- Coupons Table (Offers & Pricing Service)
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applicable_categories UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Vendor Portfolio Table (Media Service)
CREATE TABLE public.vendor_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vendor_portfolio ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_vendor_portfolio_vendor ON public.vendor_portfolio(vendor_id);

-- RLS Policies

-- User Roles: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Vendors: Vendors can manage their own profile
CREATE POLICY "Anyone can view active vendors"
  ON public.vendors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can update their own profile"
  ON public.vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can insert their profile"
  ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Categories: Public read, admin write
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Vendor Services: Vendors manage their services, consumers view
CREATE POLICY "Anyone can view available services"
  ON public.vendor_services FOR SELECT
  USING (is_available = true);

CREATE POLICY "Vendors can manage their services"
  ON public.vendor_services FOR ALL
  TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Bookings: Consumers and vendors can view their bookings
CREATE POLICY "Consumers can view their bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (consumer_id = auth.uid());

CREATE POLICY "Vendors can view their bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

CREATE POLICY "Consumers can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (consumer_id = auth.uid());

CREATE POLICY "Consumers can update their bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (consumer_id = auth.uid());

CREATE POLICY "Vendors can update bookings status"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Payments: Users can view their own payments
CREATE POLICY "Users can view their payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Reviews: Public read, consumers write
CREATE POLICY "Anyone can view published reviews"
  ON public.reviews FOR SELECT
  USING (is_published = true);

CREATE POLICY "Consumers can create reviews for their bookings"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    consumer_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND consumer_id = auth.uid() AND status = 'completed')
  );

CREATE POLICY "Consumers can update their reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (consumer_id = auth.uid());

CREATE POLICY "Vendors can respond to reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Messages: Users can view/send messages in their conversations
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Notifications: Users can view their notifications
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Addresses: Users manage their addresses
CREATE POLICY "Users can manage their addresses"
  ON public.addresses FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Coupons: Public read active coupons
CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true AND now() BETWEEN valid_from AND valid_until);

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Vendor Portfolio: Public read, vendors write
CREATE POLICY "Anyone can view vendor portfolios"
  ON public.vendor_portfolio FOR SELECT
  USING (true);

CREATE POLICY "Vendors can manage their portfolio"
  ON public.vendor_portfolio FOR ALL
  TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_services_updated_at
  BEFORE UPDATE ON public.vendor_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update vendor rating when review is added
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vendors
  SET 
    rating = (SELECT AVG(rating) FROM public.reviews WHERE vendor_id = NEW.vendor_id AND is_published = true),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE vendor_id = NEW.vendor_id AND is_published = true),
    updated_at = now()
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_rating_on_review
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_rating();

-- Function to set booking reference on insert
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_reference_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_reference();
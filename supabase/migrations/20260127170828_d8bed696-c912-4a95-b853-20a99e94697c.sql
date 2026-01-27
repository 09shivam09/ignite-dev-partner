-- Create services table for the marketplace (simpler than categories)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the core services for event marketplace
INSERT INTO public.services (name, slug, icon) VALUES
  ('Catering', 'catering', 'UtensilsCrossed'),
  ('Photography', 'photography', 'Camera'),
  ('Videography', 'videography', 'Video'),
  ('Decoration', 'decoration', 'Sparkles'),
  ('Venue', 'venue', 'Building'),
  ('DJ & Music', 'dj-music', 'Music'),
  ('Makeup Artist', 'makeup-artist', 'Palette'),
  ('Mehendi Artist', 'mehendi-artist', 'Hand'),
  ('Entertainment', 'entertainment', 'PartyPopper'),
  ('Invitation Cards', 'invitation-cards', 'Mail'),
  ('Cake & Bakery', 'cake-bakery', 'Cake'),
  ('Florist', 'florist', 'Flower')
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS on services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Anyone can view services
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT USING (true);

-- Modify vendor_services to include price range
ALTER TABLE public.vendor_services 
  ADD COLUMN IF NOT EXISTS price_min NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_max NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id);

-- Modify events table for marketplace needs
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS budget_min NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_max NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create event_services junction table for required services
CREATE TABLE IF NOT EXISTS public.event_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, service_id)
);

ALTER TABLE public.event_services ENABLE ROW LEVEL SECURITY;

-- Users can manage their event services
CREATE POLICY "Users can manage their event services" ON public.event_services
  FOR ALL USING (
    event_id IN (SELECT id FROM public.events WHERE creator_id = auth.uid())
  );

-- Anyone can view event services for active events
CREATE POLICY "Anyone can view event services" ON public.event_services
  FOR SELECT USING (true);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  vendor_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(event_id, vendor_id)
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Users can view their own inquiries
CREATE POLICY "Users can view their inquiries" ON public.inquiries
  FOR SELECT USING (user_id = auth.uid());

-- Users can create inquiries
CREATE POLICY "Users can create inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Vendors can view inquiries for their vendor profile
CREATE POLICY "Vendors can view their inquiries" ON public.inquiries
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

-- Vendors can update inquiry status
CREATE POLICY "Vendors can update inquiry status" ON public.inquiries
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

-- Add city column to vendors if not exists (it exists but ensure it's there)
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for faster vendor matching queries
CREATE INDEX IF NOT EXISTS idx_vendors_city ON public.vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendor_services_service_id ON public.vendor_services(service_id);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_inquiries_event_id ON public.inquiries(event_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_vendor_id ON public.inquiries(vendor_id);
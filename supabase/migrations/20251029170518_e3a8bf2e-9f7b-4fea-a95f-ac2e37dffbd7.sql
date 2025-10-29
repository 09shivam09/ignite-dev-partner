-- Create offers table for promotional campaigns
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount NUMERIC,
  image_url TEXT,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  applicable_categories UUID[] DEFAULT '{}',
  applicable_services UUID[] DEFAULT '{}',
  min_booking_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  terms_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active offers
CREATE POLICY "Anyone can view active offers"
  ON public.offers
  FOR SELECT
  USING (is_active = true AND NOW() >= valid_from AND NOW() <= valid_until);

-- Admins can manage offers
CREATE POLICY "Admins can manage offers"
  ON public.offers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images',
  'review-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for review images
CREATE POLICY "Users can upload review images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'review-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view review images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'review-images');

CREATE POLICY "Users can update their review images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'review-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage bucket for vendor portfolios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-portfolios',
  'vendor-portfolios',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for vendor portfolios
CREATE POLICY "Vendors can upload portfolio images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'vendor-portfolios' AND
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.user_id = auth.uid()
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Anyone can view portfolio images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vendor-portfolios');

CREATE POLICY "Vendors can manage their portfolio images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'vendor-portfolios' AND
    EXISTS (
      SELECT 1 FROM vendors 
      WHERE vendors.user_id = auth.uid()
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- Add preferences column to profiles for personalized recommendations
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Add city column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for faster offer queries
CREATE INDEX IF NOT EXISTS idx_offers_validity ON public.offers(valid_from, valid_until, is_active);
CREATE INDEX IF NOT EXISTS idx_offers_categories ON public.offers USING GIN(applicable_categories);

-- Create index for service search optimization
CREATE INDEX IF NOT EXISTS idx_vendor_services_category ON public.vendor_services(category_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_available ON public.vendor_services(is_available);

-- Update timestamp trigger for offers
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
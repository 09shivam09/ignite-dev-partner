-- Fix function search paths for security
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET 
    rating = (SELECT AVG(rating) FROM public.reviews WHERE vendor_id = NEW.vendor_id AND is_published = true),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE vendor_id = NEW.vendor_id AND is_published = true),
    updated_at = now()
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$;
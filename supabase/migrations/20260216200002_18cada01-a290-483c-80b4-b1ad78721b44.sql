
-- Add supported_event_types array column to vendors table
-- This allows vendors to specify which event types they serve
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS supported_event_types text[] DEFAULT '{}';

-- Add index for event_type on events table for faster filtering
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events (event_type);

-- Add GIN index for supported_event_types on vendors for array containment queries
CREATE INDEX IF NOT EXISTS idx_vendors_supported_event_types ON public.vendors USING GIN (supported_event_types);

-- Add index for city + is_active on vendors (common query pattern)
CREATE INDEX IF NOT EXISTS idx_vendors_city_active ON public.vendors (city, is_active);

-- Backfill existing vendors: set all event types so they remain visible
-- This ensures backward compatibility for wedding-era vendors
UPDATE public.vendors 
SET supported_event_types = ARRAY['wedding', 'birthday', 'corporate', 'kitty-party', 'engagement', 'baby-shower']
WHERE supported_event_types = '{}' OR supported_event_types IS NULL;

-- ============================================
-- PERFORMANCE INDEXES FOR MARKETPLACE
-- ============================================

-- Create index on inquiries for common query patterns
CREATE INDEX IF NOT EXISTS idx_inquiries_event_id ON public.inquiries(event_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_vendor_id ON public.inquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- Create index on events for creator lookups
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON public.events(creator_id);

-- Create index on vendors for city filtering
CREATE INDEX IF NOT EXISTS idx_vendors_city ON public.vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON public.vendors(is_active);

-- Create index on vendor_services for service matching
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_id ON public.vendor_services(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_service_id ON public.vendor_services(service_id);
CREATE INDEX IF NOT EXISTS idx_vendor_services_is_available ON public.vendor_services(is_available);
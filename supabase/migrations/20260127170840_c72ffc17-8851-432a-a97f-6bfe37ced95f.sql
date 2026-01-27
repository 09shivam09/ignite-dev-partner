-- Fix RLS for saved_vendors table
CREATE POLICY "Users can manage their saved vendors" ON public.saved_vendors
  FOR ALL USING (user_id = auth.uid());

-- Fix RLS for profile_views table  
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert profile views" ON public.profile_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their profile views" ON public.profile_views
  FOR SELECT USING (profile_id = auth.uid() OR viewer_id = auth.uid());

-- Fix RLS for vendor_analytics table
ALTER TABLE public.vendor_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors can view their analytics" ON public.vendor_analytics
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "System can insert analytics" ON public.vendor_analytics
  FOR INSERT WITH CHECK (true);
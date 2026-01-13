-- The earlier migration already created most policies successfully
-- Now just need to ensure offers table has its policy (coupons policy already exists)

-- Enable RLS on offers table if not enabled
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Drop and recreate offers policy to ensure it exists
DROP POLICY IF EXISTS "Anyone can view active offers" ON offers;

CREATE POLICY "Anyone can view active offers"
ON offers FOR SELECT
USING (is_active = true);
-- PHASE 1: Core Profile System Database Schema

-- Add columns to profiles
ALTER TABLE profiles ADD COLUMN username TEXT;
ALTER TABLE profiles ADD COLUMN cover_image_url TEXT;
ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN profile_completion_score INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN profile_views INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN bio_tags TEXT[];
ALTER TABLE profiles ADD COLUMN website_url TEXT;
ALTER TABLE profiles ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;

-- Add columns to vendors
ALTER TABLE vendors ADD COLUMN username TEXT;
ALTER TABLE vendors ADD COLUMN tagline TEXT;
ALTER TABLE vendors ADD COLUMN price_range TEXT;
ALTER TABLE vendors ADD COLUMN years_experience INTEGER;
ALTER TABLE vendors ADD COLUMN team_size INTEGER;
ALTER TABLE vendors ADD COLUMN portfolio_count INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN response_time_hours INTEGER;
ALTER TABLE vendors ADD COLUMN booking_count_30d INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN save_count INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN service_tags TEXT[];
ALTER TABLE vendors ADD COLUMN availability_status TEXT DEFAULT 'available';
ALTER TABLE vendors ADD COLUMN video_intro_url TEXT;
ALTER TABLE vendors ADD COLUMN search_vector tsvector;

-- Add columns to vendor_portfolio
ALTER TABLE vendor_portfolio ADD COLUMN title TEXT;
ALTER TABLE vendor_portfolio ADD COLUMN description TEXT;
ALTER TABLE vendor_portfolio ADD COLUMN event_type TEXT;
ALTER TABLE vendor_portfolio ADD COLUMN event_date DATE;
ALTER TABLE vendor_portfolio ADD COLUMN tags TEXT[];
ALTER TABLE vendor_portfolio ADD COLUMN video_url TEXT;
ALTER TABLE vendor_portfolio ADD COLUMN likes_count INTEGER DEFAULT 0;
ALTER TABLE vendor_portfolio ADD COLUMN views_count INTEGER DEFAULT 0;
ALTER TABLE vendor_portfolio ADD COLUMN thumbnail_url TEXT;
ALTER TABLE vendor_portfolio ADD COLUMN medium_url TEXT;

-- Create saved_vendors table
CREATE TABLE saved_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  collection_name TEXT DEFAULT 'favorites',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id, collection_name)
);

-- Create booking_requests table
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  service_id UUID REFERENCES vendor_services(id),
  event_date DATE NOT NULL,
  event_type TEXT,
  guest_count INTEGER,
  budget_range TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  vendor_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile_views table
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  referrer_source TEXT
);

-- Create vendor_analytics table
CREATE TABLE vendor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  profile_views INTEGER DEFAULT 0,
  portfolio_clicks INTEGER DEFAULT 0,
  booking_requests INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, date)
);

-- Create indexes
CREATE UNIQUE INDEX idx_profiles_username_unique ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_verified ON profiles(is_verified);

CREATE UNIQUE INDEX idx_vendors_username_unique ON vendors(username) WHERE username IS NOT NULL;
CREATE INDEX idx_vendors_rating_desc ON vendors(rating DESC);
CREATE INDEX idx_vendors_price_range_idx ON vendors(price_range);
CREATE INDEX idx_vendors_service_tags_gin ON vendors USING GIN(service_tags);
CREATE INDEX idx_vendors_search_gin ON vendors USING GIN(search_vector);

CREATE INDEX idx_portfolio_tags_gin ON vendor_portfolio USING GIN(tags);
CREATE INDEX idx_portfolio_event_type_idx ON vendor_portfolio(event_type);
CREATE INDEX idx_portfolio_vendor_date_idx ON vendor_portfolio(vendor_id, created_at DESC);

CREATE INDEX idx_saved_vendors_user_idx ON saved_vendors(user_id, created_at DESC);
CREATE INDEX idx_saved_vendors_vendor_idx ON saved_vendors(vendor_id);

CREATE INDEX idx_booking_requests_consumer_idx ON booking_requests(consumer_id, created_at DESC);
CREATE INDEX idx_booking_requests_vendor_idx ON booking_requests(vendor_id, status, created_at DESC);

CREATE INDEX idx_profile_views_profile_idx ON profile_views(profile_id, viewed_at DESC);
CREATE INDEX idx_profile_views_vendor_idx ON profile_views(vendor_id, viewed_at DESC);

CREATE INDEX idx_vendor_analytics_vendor_date_idx ON vendor_analytics(vendor_id, date DESC);

-- Enable RLS on new tables
ALTER TABLE saved_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_analytics ENABLE ROW LEVEL SECURITY;
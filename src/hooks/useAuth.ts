import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  user_type: string | null;
  city: string | null;
}

interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  city: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid race conditions with Supabase
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (!mounted) return;
              setProfile(profileData);

              if (profileData?.user_type === 'vendor') {
                const { data: vendorData } = await supabase
                  .from('vendors')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .maybeSingle();
                
                if (mounted) setVendor(vendorData);
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
            }
            
            if (mounted) setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setVendor(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (!mounted) return;
          setProfile(profileData);

          if (profileData?.user_type === 'vendor') {
            const { data: vendorData } = await supabase
              .from('vendors')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (mounted) setVendor(vendorData);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }

      if (mounted) setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setVendor(null);
  };

  const isVendor = profile?.user_type === 'vendor';
  const isUser = profile?.user_type === 'consumer';
  const needsOnboarding = !profile?.user_type;
  const vendorNeedsSetup = isVendor && !vendor;

  return {
    user,
    session,
    profile,
    vendor,
    loading,
    signOut,
    isVendor,
    isUser,
    needsOnboarding,
    vendorNeedsSetup,
  };
}

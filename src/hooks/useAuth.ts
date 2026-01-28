import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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

type UseAuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  vendor: Vendor | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isVendor: boolean;
  isUser: boolean;
  needsOnboarding: boolean;
  vendorNeedsSetup: boolean;
};

const AuthContext = createContext<UseAuthValue | undefined>(undefined);

function useProvideAuth(): UseAuthValue {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const lastHandledUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
      let timeoutId: number | undefined;
      const task = Promise.resolve(promise);
      const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
      });
      try {
        return await Promise.race([task, timeoutPromise]);
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
      }
    };

    const loadForSession = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        lastHandledUserIdRef.current = null;
        setProfile(null);
        setVendor(null);
        setLoading(false);
        return;
      }

      const userId = nextSession.user.id;
      // Avoid duplicate profile/vendor fetches for the same user across rapid auth events.
      if (lastHandledUserIdRef.current === userId && profile) {
        setLoading(false);
        return;
      }
      lastHandledUserIdRef.current = userId;
      setLoading(true);

      try {
        // Load profile
        const { data: profileData } = await withTimeout(
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          25000,
          'Profile load'
        );
        if (!mounted) return;
        let resolvedProfile = profileData as Profile | null;

        // If profile doesn't exist yet (common if a user was created without our signup flow),
        // create it from auth metadata so login can proceed smoothly.
        if (!resolvedProfile) {
          const meta = (nextSession.user.user_metadata ?? {}) as Record<string, unknown>;
          const inferredType = (meta.user_type as string | undefined) ?? null;
          const inferredName = (meta.full_name as string | undefined) ?? (nextSession.user.email ?? null);

          const { data: created, error: createError } = await withTimeout(
            supabase
              .from('profiles')
              .insert({
                user_id: userId,
                email: nextSession.user.email ?? null,
                full_name: inferredName,
                user_type: inferredType,
              })
              .select('*')
              .maybeSingle(),
            25000,
            'Profile create'
          );

          // Ignore duplicates (another tab / race) and just re-fetch.
          if (createError && !createError.message?.toLowerCase().includes('duplicate')) {
            console.error('Error creating profile on login:', createError);
          }

          if (!mounted) return;
          if (created) {
            resolvedProfile = created as Profile;
          } else {
            const { data: refetched } = await withTimeout(
              supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
              25000,
              'Profile reload'
            );
            if (!mounted) return;
            resolvedProfile = (refetched as Profile | null) ?? null;
          }
        }

        setProfile(resolvedProfile);

        if (resolvedProfile?.user_type === 'vendor') {
          const { data: vendorData } = await withTimeout(
            supabase.from('vendors').select('*').eq('user_id', userId).maybeSingle(),
            25000,
            'Vendor load'
          );
          if (!mounted) return;
          setVendor(vendorData);
        } else {
          setVendor(null);
        }
      } catch (error) {
        console.error('Error loading auth profile:', error);
        if (!mounted) return;
        setProfile(null);
        setVendor(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Auth state listener (Supabase emits INITIAL_SESSION immediately)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // IMPORTANT: Do not await here.
      // Supabase auth waits for subscribers; awaiting slow profile loads can cause
      // signInWithPassword() to appear "stuck" even when /token succeeds.
      void loadForSession(nextSession);
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

  return useMemo(
    () => ({
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
    }),
    [
      user,
      session,
      profile,
      vendor,
      loading,
      isVendor,
      isUser,
      needsOnboarding,
      vendorNeedsSetup,
    ]
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useProvideAuth();
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): UseAuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider />');
  }
  return ctx;
}

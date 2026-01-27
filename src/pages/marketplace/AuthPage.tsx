import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PartyPopper, Store } from "lucide-react";
import { USER_ROLES, type UserRole } from "@/lib/constants";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: USER_ROLES.USER as UserRole,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has profile with role
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile?.user_type === 'vendor') {
          // Check if vendor profile exists
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!vendor) {
            navigate("/marketplace/vendor/onboarding");
          } else {
            navigate("/marketplace/vendor/dashboard");
          }
        } else if (profile?.user_type === 'user') {
          navigate("/marketplace");
        } else {
          // No role set, stay on auth page for role selection
        }
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile?.user_type === 'vendor') {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!vendor) {
            navigate("/marketplace/vendor/onboarding");
          } else {
            navigate("/marketplace/vendor/dashboard");
          }
        } else if (profile?.user_type === 'user') {
          navigate("/marketplace");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/marketplace/auth`,
            data: {
              full_name: formData.fullName,
              user_type: formData.role,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create profile with role
          const { error: profileError } = await supabase.from('profiles').insert({
            user_id: data.user.id,
            full_name: formData.fullName,
            email: formData.email,
            user_type: formData.role,
          });

          if (profileError && !profileError.message.includes('duplicate')) {
            throw profileError;
          }
        }

        toast({
          title: "Account created!",
          description: "You can now sign in to your account.",
        });
        setIsSignUp(false);
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-3 text-center">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-primary mb-1">
              🎉 EventConnect
            </h1>
            <p className="text-sm text-muted-foreground">India's Event Marketplace</p>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Join as a user or vendor"
              : "Sign in to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>I am a...</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value={USER_ROLES.USER}
                        id="user"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="user"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <PartyPopper className="mb-2 h-6 w-6" />
                        <span className="font-medium">Event Planner</span>
                        <span className="text-xs text-muted-foreground">Find vendors</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value={USER_ROLES.VENDOR}
                        id="vendor"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="vendor"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Store className="mb-2 h-6 w-6" />
                        <span className="font-medium">Vendor</span>
                        <span className="text-xs text-muted-foreground">Offer services</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;

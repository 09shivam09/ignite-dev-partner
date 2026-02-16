import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, PartyPopper, Store, Sparkles, ArrowRight } from "lucide-react";
import { USER_ROLES, type UserRole } from "@/lib/constants";
import { motion } from "framer-motion";

const AUTH_TIMEOUT_MS = 15000;

const withTimeout = async <T,>(
  promise: PromiseLike<T>,
  ms: number,
  label: string
): Promise<T> => {
  let timeoutId: number | undefined;
  const task = Promise.resolve(promise);
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out. Please try again.`));
    }, ms);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, profile, vendor, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: USER_ROLES.USER as UserRole,
  });

  useEffect(() => {
    if (authLoading) return;
    if (session && profile) {
      if (profile.user_type === 'vendor') {
        if (vendor) {
          navigate("/marketplace/vendor/dashboard", { replace: true });
        } else {
          navigate("/marketplace/vendor/onboarding", { replace: true });
        }
      } else if (profile.user_type === 'consumer') {
        navigate("/marketplace", { replace: true });
      }
    }
  }, [session, profile, vendor, authLoading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              emailRedirectTo: `${window.location.origin}/marketplace/auth`,
              data: {
                full_name: formData.fullName,
                user_type: formData.role,
              }
            }
          }),
          AUTH_TIMEOUT_MS,
          "Sign up"
        );

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await withTimeout(
            supabase.from('profiles').insert({
              user_id: data.user.id,
              full_name: formData.fullName,
              email: formData.email,
              user_type: formData.role,
            }),
            AUTH_TIMEOUT_MS,
            "Create profile"
          );

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
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          }),
          AUTH_TIMEOUT_MS,
          "Sign in"
        );

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
      }
    } catch (error: any) {
      console.error("[AuthPage] auth error", error);
      toast({
        title: "Error",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex">
      {/* Left side — Hero content */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
              E
            </div>
            <span className="text-xl font-semibold text-foreground">EventConnect</span>
          </div>
          <h1 className="text-5xl xl:text-6xl font-bold text-foreground leading-tight mb-6">
            Plan your perfect
            <br />
            <span className="text-gradient-primary">event experience</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mb-10 leading-relaxed">
            Connect with verified vendors across Delhi NCR. From weddings to corporate events — 
            plan, compare, and book with confidence.
          </p>
          <div className="flex flex-wrap gap-8">
            {[
              { label: "Verified Vendors", value: "500+" },
              { label: "Events Planned", value: "2,000+" },
              { label: "Cities", value: "3" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side — Auth form */}
      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-lg border-border/30">
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  E
                </div>
                <span className="font-semibold">EventConnect</span>
              </div>
              <CardTitle className="text-2xl">
                {isSignUp ? "Create your account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isSignUp ? "Join as a planner or vendor" : "Sign in to continue planning"}
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
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>I am a...</Label>
                      <RadioGroup
                        value={formData.role}
                        onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div>
                          <RadioGroupItem value={USER_ROLES.USER} id="user" className="peer sr-only" />
                          <Label
                            htmlFor="user"
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                          >
                            <PartyPopper className="mb-2 h-5 w-5 text-primary" />
                            <span className="font-medium text-sm">Event Planner</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value={USER_ROLES.VENDOR} id="vendor" className="peer sr-only" />
                          <Label
                            htmlFor="vendor"
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-card p-4 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                          >
                            <Store className="mb-2 h-5 w-5 text-primary" />
                            <span className="font-medium text-sm">Vendor</span>
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
                    className="h-11"
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
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="w-full h-11 font-medium" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : isSignUp ? (
                    <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm pt-2">
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
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;

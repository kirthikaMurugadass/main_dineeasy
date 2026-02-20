"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy admin signup page - redirects to new auth signup
 * This page is kept for backward compatibility
 */
export default function AdminSignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup");
  }, [router]);

  return null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Account created successfully! Signing you in...");
        
        // Automatically sign in after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          toast.error("Account created but sign in failed. Please try logging in.");
          router.push("/admin/login");
          return;
        }

        // Redirect to dashboard
        router.push("/admin");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      const errorMessage =
        err.message === "User already registered"
          ? "An account with this email already exists. Please sign in instead."
          : err.message || "Failed to create account. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-10"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80")',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background" />
        </div>
        <div className="noise absolute inset-0 -z-[5]" />

        {/* Back link */}
        <Link
          href="/"
          className="absolute left-6 top-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        {/* Signup card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="w-full max-w-md mx-6"
        >
          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-premium">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center text-center">
              <AppLogo iconOnly size="lg" className="mb-4" />
              <PageTitle
                className="text-center"
                description="Create your account to get started"
              >
                Join DineEasy
              </PageTitle>
            </div>

            <motion.form
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSignup}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@restaurant.ch"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password || !confirmPassword}
                className="w-full h-12 bg-espresso text-warm hover:bg-espresso/90 glow-gold text-base"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/admin/login"
                  className="text-gold hover:text-gold/80 underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </ThemeProvider>
  );
}

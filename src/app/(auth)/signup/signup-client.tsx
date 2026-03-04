"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";

export function SignupClient({
  plan,
  billing,
}: {
  plan?: string;
  billing?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const isProIntent = plan === "pro";
  const billingCycle = billing === "annual" ? "annual" : "monthly";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const lastSubmitRef = useRef<number | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const now = Date.now();
    if (lastSubmitRef.current && now - lastSubmitRef.current < 800) return;
    lastSubmitRef.current = now;

    if (!email || !password || !confirmPassword) {
      toast.error(t.auth.signup.errors.emptyFields);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t.auth.signup.errors.passwordMismatch);
      return;
    }
    if (password.length < 6) {
      toast.error(t.auth.signup.errors.passwordTooShort);
      return;
    }

    setLoading(true);
    try {
      // Step 1: Register user with our custom API (bcrypt hashing)
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(registerData.error || "Registration failed");
      }

      // Step 2: Create Supabase Auth session for compatibility
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (signInError) {
        // If Supabase Auth sign-in fails, user is still registered
        // Redirect to login page
        toast.success(t.auth.signup.success);
        toast.error(t.auth.signup.signInAfterSignup);
        router.push("/login");
        return;
      }

      if (registerData.success) {
        toast.success(t.auth.signup.success);
        if (isProIntent) {
          router.push(`/admin/onboarding?plan=pro&billing=${billingCycle}`);
        } else {
          router.push("/admin");
        }
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "";
      let errorMessage: string;

      if (message.toLowerCase().includes("rate limit")) {
        errorMessage =
          "Too many signup attempts. Please wait a few minutes and try again.";
      } else if (
        message.includes("already exists") ||
        message.includes("User already")
      ) {
        errorMessage = t.auth.signup.errors.userExists;
      } else {
        errorMessage = message || t.auth.signup.errors.genericError;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card/80 p-6 shadow-floating backdrop-blur-xl sm:p-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              {t.auth.signup.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.auth.signup.subtitle}
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t.auth.signup.emailLabel}
              </Label>
              <div className="relative">
                <Mail
                  size={18}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "email"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder={t.auth.signup.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 rounded-xl border-border/80 bg-background/80 pl-11 pr-4"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t.auth.signup.passwordLabel}
              </Label>
              <div className="relative">
                <Lock
                  size={18}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "password"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <PasswordInput
                  id="password"
                  placeholder={t.auth.signup.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 rounded-xl border-border/80 bg-background/80 pl-11"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                {t.auth.signup.confirmPasswordLabel}
              </Label>
              <div className="relative">
                <Lock
                  size={18}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === "confirmPassword"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                <PasswordInput
                  id="confirmPassword"
                  placeholder={t.auth.signup.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  className="h-12 rounded-xl border-border/80 bg-background/80 pl-11"
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
              className="h-12 w-full rounded-xl bg-primary text-primary-foreground shadow-soft hover:bg-primary/90"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <Loader2 size={18} className="animate-spin" />
                    {t.auth.signup.submitButton}...
                  </motion.span>
                ) : (
                  <motion.span
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t.auth.signup.submitButton}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t.auth.signup.haveAccount}{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                {t.auth.signup.signInLink}
              </Link>
            </p>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}


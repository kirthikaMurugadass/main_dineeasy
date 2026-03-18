"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { AuthSplitPanel } from "@/components/auth/auth-split-panel";

export function SignupClient({
  plan,
  billing,
}: {
  plan?: string;
  billing?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  void plan;
  void billing;

  const [name, setName] = useState("");
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

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedEmail || !normalizedPassword || !normalizedConfirmPassword) {
      toast.error(t.auth?.signup?.errors?.emptyFields || t.auth.signup.errors.emptyFields || "Please fill in all fields");
      return;
    }
    if (normalizedPassword !== normalizedConfirmPassword) {
      toast.error(t.auth?.signup?.errors?.passwordMismatch || t.auth.signup.errors.passwordMismatch || "Passwords do not match");
      return;
    }
    if (normalizedPassword.length < 6) {
      toast.error(t.auth?.signup?.errors?.passwordTooShort || t.auth.signup.errors.passwordTooShort || "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
        options: {
          emailRedirectTo: `${
            typeof window !== "undefined" ? window.location.origin : ""
          }/login`,
        },
      });
      console.log("Signup:", data, error);
      if (error) throw error;

      // Supabase can return an obfuscated user object for existing accounts
      // (especially when email confirmation is enabled). Treat it as duplicate.
      const isDuplicateSignupResponse =
        !!data.user &&
        Array.isArray((data.user as { identities?: unknown[] }).identities) &&
        ((data.user as { identities?: unknown[] }).identities?.length ?? 0) === 0;

      if (isDuplicateSignupResponse) {
        throw new Error("User already exists");
      }

      if (data.user) {
        if (data.session) {
          toast.success(
            t.auth?.signup?.success ||
              t.auth.signup.success ||
              "Account created successfully! You are now signed in."
          );
          router.push("/admin");
          router.refresh();
        } else {
          // Recommended flow: attempt immediate login so users can continue directly
          // when email confirmation is disabled.
          await supabase.auth.signOut();
          const { data: loginData, error: loginError } =
            await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password: normalizedPassword,
            });
          console.log("Login:", loginData, loginError);

          if (loginData?.session) {
            toast.success(
              t.auth?.signup?.success ||
                t.auth.signup.success ||
                "Account created successfully! You are now signed in."
            );
            router.push("/admin");
            router.refresh();
            return;
          }

          if (loginError?.message?.toLowerCase().includes("email not confirmed")) {
            toast.success("Please verify your email before login");
          } else {
            toast.success("Account created successfully! Please sign in.");
          }
          router.push("/login");
        }
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "";
      let errorMessage: string;

      if (message.toLowerCase().includes("rate limit")) {
        errorMessage = (t.auth?.signup?.errors as any)?.rateLimit || t.auth.signup.errors.genericError || "Too many signup attempts. Please wait a few minutes and try again.";
      } else if (
        message === "User already registered" ||
        message === "User already exists" ||
        message.toLowerCase().includes("already registered") ||
        message.toLowerCase().includes("already exists")
      ) {
        errorMessage = t.auth?.signup?.errors?.userExists || t.auth.signup.errors.userExists || "An account with this email already exists. Please sign in instead.";
      } else {
        errorMessage = message || t.auth?.signup?.errors?.genericError || t.auth.signup.errors.genericError || "Failed to create account. Please try again.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitPanel
      imageSrc="/images/sign3.jpg"
      imageOnLeft={true}
      leftHeading={t.auth?.signup?.panelGreeting || t.auth.signup.panelGreeting || "Welcome Back!"}
      leftSubtitle={t.auth?.signup?.panelDescription || t.auth.signup.panelDescription || "To keep connected with us please login with your personal info"}
      leftButtonText={t.auth?.signup?.panelButton || t.auth.signup.panelButton || "SIGN IN"}
      leftButtonHref="/login"
      formTitle={t.auth?.signup?.title || t.auth.signup.title || "Create Account"}
      formSubtitle={t.auth?.signup?.subtitle || t.auth.signup.subtitle || "Start your digital menu journey"}
    >
      <form onSubmit={handleSignup} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-2"
        >
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            {(t.auth?.signup as any)?.nameLabel || "Name"}
          </Label>
          <div className="relative">
            <User
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                focusedField === "name" ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <Input
              id="name"
              type="text"
              placeholder={(t.auth?.signup as any)?.namePlaceholder || "Your name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              className={`h-12 rounded-[14px] border bg-white/70 pl-10 pr-4 text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-300 ${
                focusedField === "name"
                  ? "border-primary/40 ring-2 ring-primary/15"
                  : "border-border focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
              }`}
              disabled={loading}
              autoComplete="name"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-2"
        >
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            {t.auth?.signup?.emailLabel || t.auth.signup.emailLabel || "Email address"}
          </Label>
          <div className="relative">
            <Mail
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                focusedField === "email" ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <Input
              id="email"
              type="email"
              placeholder={t.auth?.signup?.emailPlaceholder || t.auth.signup.emailPlaceholder || "you@restaurant.ch"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className={`h-12 rounded-[14px] border bg-white/70 pl-10 pr-4 text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-300 ${
                focusedField === "email"
                  ? "border-primary/40 ring-2 ring-primary/15"
                  : "border-border focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
              }`}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-2"
        >
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            {t.auth?.signup?.passwordLabel || t.auth.signup.passwordLabel || "Password"}
          </Label>
          <div className="relative">
            <Lock
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                focusedField === "password" ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <PasswordInput
              id="password"
              placeholder={t.auth?.signup?.passwordPlaceholder || t.auth.signup.passwordPlaceholder || "Create a password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className={`h-12 rounded-[14px] border bg-white/70 pl-10 text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-300 ${
                focusedField === "password"
                  ? "border-primary/40 ring-2 ring-primary/15"
                  : "border-border focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
              }`}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-2"
        >
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            {t.auth?.signup?.confirmPasswordLabel || t.auth.signup.confirmPasswordLabel || "Confirm Password"}
          </Label>
          <div className="relative">
            <Lock
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                focusedField === "confirmPassword" ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <PasswordInput
              id="confirmPassword"
              placeholder={t.auth?.signup?.confirmPasswordPlaceholder || t.auth.signup.confirmPasswordPlaceholder || "Confirm your password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={() => setFocusedField(null)}
              className={`h-12 rounded-[14px] border bg-white/70 pl-10 text-foreground placeholder:text-muted-foreground shadow-sm transition-all duration-300 ${
                focusedField === "confirmPassword"
                  ? "border-primary/40 ring-2 ring-primary/15"
                  : "border-border focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15"
              }`}
              required
              disabled={loading}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        </motion.div>

        <Button
          type="submit"
          disabled={loading || !email || !password || !confirmPassword}
          className="h-12 w-full rounded-[14px] border border-primary/30 bg-primary/20 text-foreground font-semibold shadow-sm transition-colors duration-300 hover:bg-primary/30 active:bg-primary/35"
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
                {t.auth?.signup?.submitButton || t.auth.signup.submitButton || "Create Account"}...
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {t.auth?.signup?.submitButton || t.auth.signup.submitButton || "Create Account"}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t.auth?.signup?.haveAccount || t.auth.signup.haveAccount || "Already have an account?"}{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-2 transition-colors duration-300 hover:text-primary/80"
          >
            {t.auth?.signup?.signInLink || t.auth.signup.signInLink || "Sign in"}
          </Link>
        </p>
      </form>
    </AuthSplitPanel>
  );
}


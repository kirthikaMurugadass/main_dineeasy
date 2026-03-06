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
  const isProIntent = plan === "pro";
  const billingCycle = billing === "annual" ? "annual" : "monthly";

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
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${
            typeof window !== "undefined" ? window.location.origin : ""
          }/admin`,
        },
      });
      if (error) throw error;

      if (data.user) {
        toast.success(t.auth.signup.success);
        const { error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          toast.error(t.auth.signup.signInAfterSignup);
          router.push("/login");
          return;
        }
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
      } else if (message === "User already registered") {
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
    <AuthSplitPanel
      imageSrc="/images/image2.jpg"
      imageOnLeft={true}
      leftHeading="Welcome Back!"
      leftSubtitle="To keep connected with us please login with your personal info"
      leftButtonText="SIGN IN"
      leftButtonHref="/login"
      formTitle="Create Account"
      formSubtitle="or use your email for registration"
    >
      <form onSubmit={handleSignup} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-2"
        >
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Name
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
              placeholder="Your name"
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
            {t.auth.signup.emailLabel}
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
              placeholder="you@restaurant.ch"
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
            {t.auth.signup.passwordLabel}
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
              placeholder="Enter your password"
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
            {t.auth.signup.confirmPasswordLabel}
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
              placeholder="Confirm your password"
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
            className="font-medium text-primary underline-offset-2 transition-colors duration-300 hover:text-primary/80"
          >
            {t.auth.signup.signInLink}
          </Link>
        </p>
      </form>
    </AuthSplitPanel>
  );
}


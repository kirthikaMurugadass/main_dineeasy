"use client";

import { useState, useEffect } from "react";
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
import { AuthSplitPanel } from "@/components/auth/auth-split-panel";
import { setCachedRestaurant } from "@/lib/restaurant-cache";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t.auth?.login?.errors?.emptyFields || t.auth.login.errors.emptyFields || "Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const normalizedEmail = email.toLowerCase().trim();

      // Primary login path: Supabase Auth (used by current signup flow).
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      // Legacy fallback: old custom users table API verifies bcrypt and syncs auth account.
      if (authError || !authData?.session) {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });

        if (!loginResponse.ok) {
          const loginData = await loginResponse.json().catch(() => ({} as any));
          throw new Error(loginData?.error || "Invalid email or password");
        }

        // After legacy verification/sync, retry Supabase session creation.
        await new Promise((resolve) => setTimeout(resolve, 250));
        const retry = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        authData = retry.data;
        authError = retry.error;
      }

      if (authError || !authData?.session) {
        const sessionError =
          (t.auth?.login?.errors as any)?.sessionError ||
          t.auth.login.errors.genericError ||
          "Failed to create session. Please try again.";
        throw new Error(sessionError);
      }

      if (authData?.session) {
        const authUserId = authData.session.user.id;
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id, name")
          .eq("owner_id", authUserId)
          .maybeSingle();
        if (restaurant) {
          setCachedRestaurant({ id: restaurant.id, name: restaurant.name });
        }
        toast.success(t.auth?.login?.success || t.auth.login.success || "Welcome back!");
        router.push("/admin");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "";

      if (message === "Failed to fetch" || message.includes("fetch")) {
        const connectionError = (t.auth?.login?.errors as any)?.connectionError || t.auth.login.errors.genericError || "Cannot reach server. Please check your connection and try again.";
        toast.error(connectionError);
      } else {
        const errorMessage =
          message.includes("Invalid") || message.includes("password")
            ? t.auth?.login?.errors?.invalidCredentials || t.auth.login.errors.invalidCredentials
            : message.includes("session") || message.includes("Failed to create session")
            ? (t.auth?.login?.errors as any)?.sessionError || t.auth.login.errors.genericError
            : message || t.auth?.login?.errors?.genericError || t.auth.login.errors.genericError;
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitPanel
      imageSrc="/images/sign2.jpg"
      imageOnLeft={false}
      leftHeading={t.auth?.login?.panelGreeting || t.auth.login.panelGreeting || "Hello, Friend!"}
      leftSubtitle={t.auth?.login?.panelDescription || t.auth.login.panelDescription || "Enter your personal details and start your journey with us"}
      leftButtonText={t.auth?.login?.panelButton || t.auth.login.panelButton || "SIGN UP"}
      leftButtonHref="/signup"
      formTitle={t.auth?.login?.title || t.auth.login.title || "Sign In"}
      formSubtitle={t.auth?.login?.subtitle || t.auth.login.subtitle || "or use your email for login"}
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-2"
        >
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            {t.auth?.login?.emailLabel || t.auth.login.emailLabel || "Email address"}
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
              placeholder={t.auth?.login?.emailPlaceholder || t.auth.login.emailPlaceholder || "you@restaurant.ch"}
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
          transition={{ delay: 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-2"
        >
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            {t.auth?.login?.passwordLabel || t.auth.login.passwordLabel || "Password"}
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
              placeholder={t.auth?.login?.passwordPlaceholder || t.auth.login.passwordPlaceholder || "Enter your password"}
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
              autoComplete="current-password"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-xs font-medium text-primary underline-offset-2 transition-colors duration-300 hover:text-primary/80"
            >
              {t.auth?.login?.forgotPassword || t.auth.login.forgotPassword || "Forgot password?"}
            </button>
          </div>
        </motion.div>

        <Button
          type="submit"
          disabled={loading || !email || !password}
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
                {t.auth?.login?.submitButton || t.auth.login.submitButton || "Sign In"}...
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {t.auth?.login?.submitButton || t.auth.login.submitButton || "Sign In"}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t.auth?.login?.noAccount || t.auth.login.noAccount || "Don't have an account?"}{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-2 transition-colors duration-300 hover:text-primary/80"
          >
            {t.auth?.login?.signUpLink || t.auth.login.signUpLink || "Sign up"}
          </Link>
        </p>
      </form>
    </AuthSplitPanel>
  );
}

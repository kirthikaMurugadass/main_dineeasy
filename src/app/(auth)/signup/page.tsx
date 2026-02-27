"use client";

import { useState } from "react";
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

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
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
        options: { emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/admin` },
      });
      if (error) throw error;
      if (data.user) {
        toast.success(t.auth.signup.success);
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          toast.error(t.auth.signup.signInAfterSignup);
          router.push("/login");
          return;
        }
        router.push("/admin");
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "";
      const errorMessage =
        message === "User already registered"
          ? t.auth.signup.errors.userExists
          : message || t.auth.signup.errors.genericError;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-6 lg:p-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-floating backdrop-blur-xl"
      >
        <div className="flex min-h-[600px] flex-col lg:flex-row">
          {/* Image panel (left on desktop) */}
          <div className="relative order-first hidden min-h-[280px] w-full overflow-hidden lg:order-none lg:block lg:min-h-0 lg:w-[50%]">
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/image2.jpg')" }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-primary/60" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
                  {t.auth.signup.panelGreeting}
                </h2>
                <p className="max-w-sm text-base text-white/90">{t.auth.signup.panelDescription}</p>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="rounded-xl border-2 border-white/50 bg-transparent px-6 py-3 text-white hover:bg-white/15 hover:border-white/70"
                  >
                    {t.auth.signup.panelButton}
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Form side */}
          <div className="flex w-full flex-col justify-center p-8 lg:w-[50%] lg:p-12">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mx-auto w-full max-w-sm space-y-8"
            >
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
                  {t.auth.signup.title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{t.auth.signup.subtitle}</p>
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
                        focusedField === "email" ? "text-primary" : "text-muted-foreground"
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
                        focusedField === "password" ? "text-primary" : "text-muted-foreground"
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
                        focusedField === "confirmPassword" ? "text-primary" : "text-muted-foreground"
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
                      <motion.span key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {t.auth.signup.submitButton}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {t.auth.signup.haveAccount}{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    {t.auth.signup.signInLink}
                  </Link>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

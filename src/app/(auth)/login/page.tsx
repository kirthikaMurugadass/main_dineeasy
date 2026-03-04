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
      toast.error(t.auth.login.errors.emptyFields);
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        toast.success(t.auth.login.success);
        router.push("/admin");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "";

      if (message === "Failed to fetch") {
        toast.error(
          "Cannot reach Supabase. Check .env.local (URL + anon key), restart dev server, and add your app URL to Supabase CORS (Project Settings → API)."
        );
      } else {
        const errorMessage =
          message === "Invalid login credentials"
            ? t.auth.login.errors.invalidCredentials
            : message || t.auth.login.errors.genericError;
        toast.error(errorMessage);
      }
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
                  {t.auth.login.title}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{t.auth.login.subtitle}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t.auth.login.emailLabel}
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
                      placeholder={t.auth.login.emailPlaceholder}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      {t.auth.login.passwordLabel}
                    </Label>
                    <button
                      type="button"
                      onClick={() => router.push("/forgot-password")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {t.auth.login.forgotPassword}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      size={18}
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                        focusedField === "password" ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <PasswordInput
                      id="password"
                      placeholder={t.auth.login.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 rounded-xl border-border/80 bg-background/80 pl-11"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email || !password}
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
                        {t.auth.login.submitButton}...
                      </motion.span>
                    ) : (
                      <motion.span key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {t.auth.login.submitButton}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {t.auth.login.noAccount}{" "}
                  <Link href="/signup" className="font-medium text-primary hover:underline">
                    {t.auth.login.signUpLink}
                  </Link>
                </p>
              </form>
            </motion.div>
      </motion.div>
    </div>
  );
}

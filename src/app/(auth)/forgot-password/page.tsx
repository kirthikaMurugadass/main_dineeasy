"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      const message =
        data?.message ||
        "If an account exists for this email, a reset link has been sent.";

      toast.success(message);
      router.push("/login");
    } catch {
      toast.error(
        "If an account exists for this email, a reset link has been sent."
      );
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
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-floating backdrop-blur-xl"
      >
        <div className="flex flex-col p-8 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t.auth.login.forgotPassword}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your email address and we’ll send you a link to reset
                your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t.auth.login.emailLabel}
                </Label>
                <div className="relative">
                  <Mail
                    size={18}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                      focused ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="h-12 rounded-xl border-border/80 bg-background/80 pl-11 pr-4"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email}
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
                    <motion.span
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Send reset link
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}


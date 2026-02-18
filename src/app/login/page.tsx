"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setSent(true);
      toast.success("Check your email for the login link!");
    } catch (err) {
      toast.error("Failed to send login link. Please try again.");
      console.error(err);
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

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="w-full max-w-md mx-6"
        >
          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-premium">
            {/* Logo */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-espresso text-warm font-serif font-bold text-xl">
                D
              </div>
              <h1 className="font-serif text-2xl font-bold">Welcome to DineEasy</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to manage your digital menus
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleLogin}
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
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-12 bg-espresso text-warm hover:bg-espresso/90 glow-gold text-base"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "Send Magic Link"
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    No password needed. We&apos;ll send you a secure login link.
                  </p>
                </motion.form>
              ) : (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                    <Mail className="h-7 w-7 text-gold" />
                  </div>
                  <h2 className="text-lg font-semibold">Check your email</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent a login link to <strong>{email}</strong>
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setSent(false)}
                    className="text-sm"
                  >
                    Use a different email
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </ThemeProvider>
  );
}

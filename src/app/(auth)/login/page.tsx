"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Welcome back!");
        router.push("/admin");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage =
        err.message === "Invalid login credentials"
          ? "Invalid email or password. Please try again."
          : err.message || "Failed to sign in. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-4 lg:p-8">
      {/* Centered Card with Split Layout */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl dark:shadow-2xl"
      >
        <div className="flex min-h-[600px] flex-col lg:flex-row">
          {/* Left Side - Form Section (50%) */}
          <div className="flex w-full flex-col justify-center bg-card p-8 lg:w-[50%] lg:p-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mx-auto w-full max-w-md space-y-6"
            >
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground font-serif">
                  Sign In
                </h1>
                <p className="text-sm text-muted-foreground">
                  or use your email for login
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                        focusedField === "email"
                          ? "text-primary"
                          : "text-muted-foreground"
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
                      className={`h-12 rounded-xl border bg-background pl-10 pr-4 text-foreground placeholder:text-muted-foreground transition-all ${
                        focusedField === "email"
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      }`}
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => toast.info("Password reset coming soon")}
                      className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock
                      size={16}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                        focusedField === "password"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={`h-12 rounded-xl border bg-background pl-10 pr-4 text-foreground placeholder:text-muted-foreground transition-all ${
                        focusedField === "password"
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                      }`}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-[#C6A75E] to-[#B8964A] font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed dark:from-[#D4AF37] dark:to-[#C6A75E]"
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Loader2 size={18} className="animate-spin" />
                        <span>Signing in...</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="default"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Sign In
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            </motion.div>
          </div>

          {/* Right Side - Image Panel (50%) */}
          <div className="relative hidden w-full overflow-hidden lg:block lg:w-[50%]">
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0"
            >
              <Image
                src="/images/image1.jpg"
                alt="Restaurant ambiance"
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </motion.div>
            <div className="absolute inset-0 bg-black/60 dark:bg-black/60" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                <h2 className="text-4xl font-bold text-white font-serif">
                  Hello, Friend!
                </h2>
                <p className="text-lg text-white/90 max-w-sm">
                  Enter your personal details and start your journey with us
                </p>
                <Link href="/signup">
                  <Button
                    variant="outline"
                    className="border-2 border-white/50 bg-transparent px-8 py-6 text-base font-semibold text-white transition-all hover:bg-white/10 hover:border-white/70"
                  >
                    SIGN UP
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

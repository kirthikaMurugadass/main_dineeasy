"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AuthSplitPanel } from "@/components/auth/auth-split-panel";
// import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";

const EASE = [0.4, 0, 0.2, 1] as const;
const STAGGER = 0.1;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const fromRegistration = searchParams.get("registered") === "1";
    const fromStorage = typeof window !== "undefined" && sessionStorage.getItem("registration-success") === "true";
    if (fromRegistration || fromStorage) {
      setShowRegistrationSuccess(true);
      if (fromRegistration) {
        toast.success("Registration successful. Please sign in.");
        sessionStorage.setItem("registration-success", "true");
        router.replace("/admin/login", { scroll: false });
      }
      if (fromStorage) {
        sessionStorage.removeItem("registration-success");
      }
    }
  }, [searchParams, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
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
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      let errorMessage = "Failed to sign in. Please check your credentials.";
      
      const errorMsg = err?.message || err?.toString() || "";
      const errorName = err?.name || "";
      
      if (errorMsg.includes("Invalid login credentials") || errorMsg.includes("Invalid credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (errorMsg.includes("Email not confirmed")) {
        errorMessage = "Please verify your email before signing in.";
      } else if (
        errorName === "TypeError" ||
        errorMsg.includes("Failed to fetch") ||
        errorMsg.includes("NetworkError")
      ) {
        errorMessage = "Cannot connect to Supabase. Please check your connection.";
      } else if (errorMsg) {
        errorMessage = errorMsg;
      }
      
      toast.error(errorMessage);
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitPanel
      imageSrc="/images/image3.jpg"
      imageOnLeft={false}
      leftHeading="Hello, Friend!"
      leftSubtitle="Enter your personal details and start your journey with us"
      leftButtonText="SIGN UP"
      leftButtonHref="/admin/signup"
      formTitle="Sign In"
      formSubtitle="or use your email for login"
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {showRegistrationSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex items-center gap-3 rounded-[14px] border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
          >
            <CheckCircle size={18} className="shrink-0" />
            <span>Registration successful. Please sign in.</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: STAGGER * 1, duration: 0.4, ease: EASE }}
          className="space-y-2"
        >
          <Label htmlFor="email" className="text-sm font-medium text-gray-300">
            Email address
          </Label>
          <div className="relative">
            <Mail
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                focusedField === "email" ? "text-gold" : "text-gray-500"
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
              className={`h-12 rounded-[14px] border bg-white/5 pl-10 pr-4 text-white placeholder:text-gray-500 transition-all duration-300 ${
                focusedField === "email"
                  ? "border-gold/50 ring-2 ring-gold/20"
                  : "border-white/10 focus-visible:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/20"
              }`}
              required
              autoComplete="email"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: STAGGER * 2, duration: 0.4, ease: EASE }}
          className="space-y-2"
        >
          <Label htmlFor="password" className="text-sm font-medium text-gray-300">
            Password
          </Label>
          <div className="relative">
            <Lock
              size={16}
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                focusedField === "password" ? "text-gold" : "text-gray-500"
              }`}
            />
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className={`h-12 rounded-[14px] border bg-white/5 pl-10 text-white placeholder:text-gray-500 transition-all duration-300 ${
                focusedField === "password"
                  ? "border-gold/50 ring-2 ring-gold/20"
                  : "border-white/10 focus-visible:border-gold/50 focus-visible:ring-2 focus-visible:ring-gold/20"
              }`}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs font-medium text-gold underline-offset-2 transition-colors duration-300 hover:text-gold/80"
            >
              Forgot Password?
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: STAGGER * 3, duration: 0.4, ease: EASE }}
        >
          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="h-12 w-full rounded-[14px] bg-gradient-to-r from-[#C6A75E] to-[#B8964A] text-[#0f0f0f] font-semibold shadow-lg shadow-gold/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-gold/40 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: STAGGER * 4, duration: 0.4 }}
          className="text-center text-sm text-gray-400"
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/admin/signup"
            className="font-medium text-gold underline-offset-2 transition-colors duration-300 hover:text-gold/80"
          >
            Sign up
          </Link>
        </motion.p>
      </form>

      {/* Forgot Password Dialog */}
      {/* <ForgotPasswordDialog
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      /> */}
    </AuthSplitPanel>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={24} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
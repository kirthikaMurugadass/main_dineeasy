"use client";

import { useRef, useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const lastSubmitRef = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl md:min-h-[600px]"
      >
        {/* Diagonal Split Container */}
        <div className="relative flex flex-col md:flex-row md:min-h-[600px]">
          {/* Welcome Section - Left Side (Green) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative flex w-full flex-col items-center justify-center bg-gradient-to-br from-green-600 to-green-700 p-8 md:w-1/2 md:p-12 order-1 md:order-1 min-h-[300px] md:min-h-0"
            style={{
              clipPath: !isMobile ? "polygon(0 0, 85% 0, 100% 100%, 0% 100%)" : "none",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-650 to-green-700"></div>
            <div className="relative z-10 text-center text-white">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-4xl font-bold mb-4 md:text-5xl"
              >
                WELCOME BACK!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-base text-green-50 md:text-lg"
              >
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Deleniti, rem?
              </motion.p>
            </div>
          </motion.div>

          {/* Form Section - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 flex w-full flex-col justify-center bg-white p-8 md:w-1/2 md:p-12 order-2 md:order-2"
            style={{
              clipPath: !isMobile ? "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" : "none",
            }}
          >
            <div className="w-full max-w-md mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">
                  {t.auth.signup.title}
                </h1>
                <div className="w-12 h-0.5 bg-black"></div>
              </div>

              <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    {t.auth.signup.emailLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder=""
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 border-0 border-b-2 border-gray-300 rounded-none bg-transparent px-0 pr-8 focus:border-green-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                    <Mail
                      size={18}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 transition-colors ${
                        focusedField === "email" ? "text-green-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {t.auth.signup.passwordLabel}
                  </Label>
                  <div className="relative">
                    <PasswordInput
                      id="password"
                      placeholder=""
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 border-0 border-b-2 border-gray-300 rounded-none bg-transparent px-0 pr-20 focus:border-green-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      wrapperClassName="relative"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                      minLength={6}
                    />
                    <Lock
                      size={18}
                      className={`absolute right-10 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                        focusedField === "password" ? "text-green-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    {t.auth.signup.confirmPasswordLabel}
                  </Label>
                  <div className="relative">
                    <PasswordInput
                      id="confirmPassword"
                      placeholder=""
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      className="h-12 border-0 border-b-2 border-gray-300 rounded-none bg-transparent px-0 pr-20 focus:border-green-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      wrapperClassName="relative"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                      minLength={6}
                    />
                    <Lock
                      size={18}
                      className={`absolute right-10 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${
                        focusedField === "confirmPassword" ? "text-green-600" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email || !password || !confirmPassword}
                  className="h-12 w-full rounded-full bg-green-600 text-white font-semibold shadow-lg hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <p className="text-center text-sm text-gray-600">
                  {t.auth.signup.haveAccount}{" "}
                  <Link
                    href="/login"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {t.auth.signup.signInLink}
                  </Link>
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}


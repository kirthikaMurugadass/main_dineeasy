"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const router = useRouter();
  const plan = searchParams.get("plan");
  const billing = searchParams.get("billing");
  const isProIntent = plan === "pro";
  const billingCycle = billing === "annual" ? "annual" : "monthly";

  // Prevent duplicate restaurants: if user already has one, go to dashboard (or checkout).
  useEffect(() => {
    let cancelled = false;
    async function checkExisting() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        if (!cancelled) setCheckingExisting(false);
        return;
      }
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (restaurant) {
        if (isProIntent) {
          router.replace(`/admin/checkout?billing=${billingCycle}`);
        } else {
          router.replace("/admin");
        }
        return;
      }
      setCheckingExisting(false);
    }
    checkExisting();
    return () => { cancelled = true; };
  }, [router, isProIntent, billingCycle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/restaurant/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Setup failed");
      }

      toast.success("Restaurant created! Welcome to DineEasy.");
      if (isProIntent) {
        router.push(`/admin/checkout?billing=${billingCycle}`);
      } else {
        router.push("/admin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.admin.onboarding.error);
    } finally {
      setLoading(false);
    }
  }

  if (checkingExisting) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
            <Store size={28} className="text-gold" />
          </div>
          <PageTitle
            className="text-center"
            description={t.admin.onboarding.description}
          >
            {t.admin.onboarding.title}
          </PageTitle>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {t.admin.onboarding.restaurantName}
            </Label>
            <Input
              id="name"
              placeholder={t.admin.onboarding.restaurantNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
              autoFocus
              required
            />
            {name && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground"
              >
                {t.admin.onboarding.yourUrl}
                <strong>
                  {name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")}
                </strong>
              </motion.p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full h-12 gap-2 bg-espresso text-warm hover:bg-espresso/90 text-base"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {t.admin.onboarding.create}
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

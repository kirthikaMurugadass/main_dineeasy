"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { redirectToCheckoutSession } from "@/lib/stripe/redirect";

export function AdminCheckoutClient({ billing }: { billing?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "already_pro">(
    "loading"
  );
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, plan_type")
        .eq("owner_id", user.id)
        .single();
      if (cancelled) return;
      // Upgrade flow must never redirect to restaurant creation. Send to dashboard instead.
      if (!restaurant) {
        toast.error("Create your restaurant first from the dashboard.");
        router.replace("/admin");
        return;
      }
      if ((restaurant as { plan_type?: string }).plan_type === "pro") {
        setStatus("already_pro");
        setTimeout(() => router.replace("/admin"), 1500);
        return;
      }
      setStatus("ready");
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function go() {
      if (status !== "ready" || redirecting) return;
      setRedirecting(true);
      try {
        const res = await fetch("/api/create-pro-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billingCycle: billing === "annual" ? "annual" : "monthly",
          }),
          credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to start checkout");
        await redirectToCheckoutSession({
          sessionId: data.sessionId as string,
          url: (data.url as string | undefined) ?? null,
        });
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Failed to start checkout");
        router.replace("/admin");
      } finally {
        if (!cancelled) setRedirecting(false);
      }
    }
    go();
    return () => {
      cancelled = true;
    };
  }, [status, redirecting, billing, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "already_pro") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          You already have Pro. Redirecting to dashboard...
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md space-y-8"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">
            Redirecting to secure checkout
          </h1>
          <p className="text-sm text-muted-foreground">
            You’ll complete payment on Stripe’s hosted checkout page.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center rounded-2xl border border-border/70 bg-card p-10 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </motion.div>
  );
}


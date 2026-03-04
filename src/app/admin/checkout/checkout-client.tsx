"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProCheckoutForm } from "@/components/subscription/pro-checkout-form";
import { toast } from "sonner";

export function AdminCheckoutClient({ billing }: { billing?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "already_pro">(
    "loading"
  );

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

  const defaultBilling = billing === "annual" ? "annual" : "monthly";

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
            Complete your Pro subscription
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose billing and enter card details. No real charge — demo only.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <ProCheckoutForm
          defaultBilling={defaultBilling}
          compact={false}
          onSuccess={() => router.replace("/admin")}
        />
      </div>
    </motion.div>
  );
}


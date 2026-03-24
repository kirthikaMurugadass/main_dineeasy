"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminConnectPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/stripe/connect/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to start onboarding");
        if (!data?.url) throw new Error("Missing onboarding URL");
        window.location.href = data.url as string;
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Failed to start onboarding");
        router.replace("/admin/settings");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Redirecting to Stripe onboarding…</span>
      </div>
    </div>
  );
}


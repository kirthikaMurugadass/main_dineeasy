"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CancelPage() {
  const sp = useSearchParams();
  const source = sp.get("source");

  useEffect(() => {
    // Cleanup any pending Stripe order payload so it doesn't accidentally confirm later.
    try {
      window.sessionStorage.removeItem("dineeasy-pending-order");
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Payment cancelled</h1>
      <p className="text-sm text-muted-foreground">
        No charges were made. You can try again whenever you’re ready.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="default">
          <Link href={source === "pro" ? "/admin" : "/"}>Go back</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Need help?</Link>
        </Button>
      </div>
    </div>
  );
}


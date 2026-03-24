"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/stores/cart-store";
import { Button } from "@/components/ui/button";

const PENDING_ORDER_KEY = "dineeasy-pending-order";

export function PaymentSuccessClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");
  const qsRestaurant = sp.get("restaurant");
  const qsMenuId = sp.get("menuId");
  const [working, setWorking] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [menuHref, setMenuHref] = useState<string>("/");
  const cart = useCartStore();
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [confettiVisible, setConfettiVisible] = useState(false);

  const info = useMemo(() => "Confirming your order…", []);

  const receiptHref =
    orderId && qsRestaurant && qsMenuId
      ? `/public-menu/${encodeURIComponent(qsRestaurant)}/${encodeURIComponent(
          qsMenuId,
        )}/checkout/success?orderId=${encodeURIComponent(orderId)}`
      : null;

  useEffect(() => {
    if (!orderId) return;
    if (typeof window === "undefined") return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const durationMs = 3000;
    const endAt = Date.now() + durationMs;
    setConfettiVisible(true);

    import("canvas-confetti")
      .then((mod) => {
        if (cancelled) return;
        const confetti = (mod as any).default ?? mod;
        const fire = confetti.create(canvas, { resize: true, useWorker: true });
        const colors = ["#22c55e", "#a78bfa", "#fbbf24", "#ef4444", "#60a5fa"];

        fire({
          particleCount: 140,
          angle: 90,
          spread: 360,
          startVelocity: 50,
          gravity: 1.05,
          ticks: 240,
          scalar: 0.95,
          origin: { x: 0.5, y: 0.45 },
          colors,
        });

        (function frame() {
          if (cancelled) return;
          const timeLeft = endAt - Date.now();
          if (timeLeft <= 0) {
            try {
              fire.reset();
            } catch {
              // ignore
            }
            setConfettiVisible(false);
            return;
          }
          if (Math.random() < 0.2) {
            fire({
              particleCount: 18,
              angle: 90,
              spread: 110,
              startVelocity: 28,
              gravity: 1.1,
              ticks: 220,
              scalar: 0.85,
              origin: { x: Math.random(), y: 0.05 },
              colors,
            });
          }
          requestAnimationFrame(frame);
        })();
      })
      .catch(() => {
        setConfettiVisible(false);
      });

    return () => {
      cancelled = true;
      setConfettiVisible(false);
    };
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        if (!sessionId) {
          router.replace(
            qsRestaurant && qsMenuId
              ? `/public-menu/${encodeURIComponent(qsRestaurant)}/${encodeURIComponent(qsMenuId)}`
              : "/",
          );
          return;
        }

        const fallbackMenuHref =
          qsRestaurant && qsMenuId
            ? `/public-menu/${encodeURIComponent(qsRestaurant)}/${encodeURIComponent(qsMenuId)}`
            : "/";

        // Verify + confirm order server-side (so we never lose pending order data on redirect)
        const confirmRes = await fetch("/api/confirm-order-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const confirmData = await confirmRes.json().catch(() => ({}));

        const nextMenuHref = (confirmData?.menuHref as string | undefined) ?? fallbackMenuHref;
        setMenuHref(nextMenuHref);

        if (!confirmRes.ok) {
          toast.error(confirmData?.error || "Failed to confirm order");
          router.replace(nextMenuHref);
          return;
        }

        if (!confirmData?.paid) {
          router.replace(nextMenuHref);
          return;
        }

        const confirmedOrderId = (confirmData?.orderId as string | undefined) ?? null;
        if (!confirmedOrderId) {
          toast.error(
            confirmData?.error || "Order details missing. Please place the order again.",
          );
          router.replace(nextMenuHref);
          return;
        }

        // Store receipt snapshot so the existing receipt page can render totals/items (same as Cash/QR)
        try {
          const snap = confirmData?.receiptSnapshot;
          if (snap && typeof window !== "undefined") {
            const key = `dineeasy-order-receipt-${confirmedOrderId}`;
            window.sessionStorage.setItem(key, JSON.stringify(snap));
          }
        } catch {
          // ignore
        }

        // Clear cart + pending payload after confirmation
        cart.clearCart();
        try {
          window.sessionStorage.removeItem(PENDING_ORDER_KEY);
          window.localStorage.removeItem(PENDING_ORDER_KEY);
        } catch {
          // ignore
        }

        // Show the same success UI as Cash/QR (with View Receipt + Back to Menu)
        setOrderId(confirmedOrderId);
        return;
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : "Payment verification failed");
        router.replace(
          qsRestaurant && qsMenuId
            ? `/public-menu/${encodeURIComponent(qsRestaurant)}/${encodeURIComponent(qsMenuId)}`
            : "/",
        );
      } finally {
        if (!cancelled) setWorking(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router, sessionId, cart, qsRestaurant, qsMenuId]);

  if (orderId) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <canvas
          ref={confettiCanvasRef}
          style={{ width: "100vw", height: "100vh" }}
          className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-200 ${
            confettiVisible ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="relative z-20 w-full max-w-lg rounded-3xl border border-border/60 bg-card p-6 text-card-foreground shadow-floating sm:p-8">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 blur-2xl" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 shadow-soft">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold text-foreground">
            Order Successful!
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Your order has been placed successfully.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              className="rounded-2xl"
              onClick={() => {
                if (receiptHref) router.replace(receiptHref);
              }}
              disabled={!receiptHref}
            >
              View Receipt
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => router.replace(menuHref)}
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex items-center gap-3 text-muted-foreground">
        {working && <Loader2 className="h-5 w-5 animate-spin" />}
        <span className="text-sm">{info}</span>
      </div>
    </div>
  );
}


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, QrCode, ShoppingBag, Calendar, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandText } from "@/components/ui/app-logo";

type Scene = "scanMenu" | "menu" | "scanBooking" | "booking";

const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

function IPhone15ProFrame({
  children,
  className,
  animated = true,
}: {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* ambient shadow under phone */}
      <div className="pointer-events-none absolute left-1/2 top-[92%] h-20 w-[18rem] -translate-x-1/2 rounded-full bg-black/15 blur-3xl dark:bg-black/45" />

      <div
        className={cn(
          "relative mx-auto w-full max-w-[280px] sm:max-w-[300px]",
          animated && "animate-phone-float"
        )}
        style={{ aspectRatio: "9 / 19.5" }}
      >
        {/* metallic brushed frame (straight-on, no tilt) */}
        <div className="absolute inset-0 rounded-[56px] bg-[linear-gradient(135deg,rgba(15,23,42,0.55),rgba(255,255,255,0.68),rgba(15,23,42,0.40))] shadow-[0_40px_90px_rgba(15,23,42,0.20)] ring-1 ring-black/10 dark:ring-white/10" />
        <div className="absolute inset-[2px] rounded-[54px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.18))] opacity-95" />

        {/* ultra-thin bezel */}
        <div className="absolute inset-[10px] rounded-[48px] bg-black/92 ring-1 ring-white/12 dark:bg-black/95" />

        {/* side buttons */}
        <div className="pointer-events-none absolute left-[-2px] top-[26%] h-10 w-1.5 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(0,0,0,0.18))] opacity-65" />
        <div className="pointer-events-none absolute left-[-2px] top-[34%] h-14 w-1.5 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(0,0,0,0.18))] opacity-65" />
        <div className="pointer-events-none absolute left-[-2px] top-[44%] h-14 w-1.5 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(0,0,0,0.18))] opacity-65" />
        <div className="pointer-events-none absolute right-[-2px] top-[34%] h-20 w-1.5 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(0,0,0,0.18))] opacity-65" />

        {/* screen */}
        <div className="absolute inset-[14px] overflow-hidden rounded-[44px] bg-[var(--background)] ring-1 ring-white/25 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)]">
          {/* dynamic island */}
          <div className="pointer-events-none absolute left-1/2 top-2 h-6 w-28 -translate-x-1/2 rounded-full bg-black/92 ring-1 ring-white/10">
            <div className="absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white/10" />
          </div>

          {/* glass glare + reflections */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -inset-[55%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)] mix-blend-screen animate-phone-glare" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.14),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(91,122,47,0.08),transparent_55%)]" />
          </div>

          {/* status row */}
          <div className="relative flex items-center justify-between px-4 pt-3 text-[10px] font-semibold text-foreground/70">
            <span>9:41</span>
            <span className="inline-flex items-center gap-2 text-foreground/55">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/65" />
              <span className="h-1.5 w-10 rounded-full bg-muted/70" />
            </span>
          </div>

          <div className="relative px-4 pb-5 pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SceneScan({
  detected,
  mode,
}: {
  detected: boolean;
  mode: "menu" | "booking";
}) {
  const isMenuScan = mode === "menu";
  const title = isMenuScan ? "DineEasy" : "Book a Table";
  const subtitle = isMenuScan ? "Scan to view menu" : "Scan to reserve";
  const tag = isMenuScan ? "QR Menu" : "Book a Table";
  const statusText = isMenuScan ? "Opening app" : "Opening booking";

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
          <Camera className="h-3.5 w-3.5" />
          Camera
        </span>
        <span className="rounded-full bg-muted/70 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
          QR Scan
        </span>
      </div>

      <motion.div
        className="mt-3 rounded-3xl bg-[var(--hero-bg)] p-4 ring-1 ring-border/60 shadow-card"
        animate={detected ? { x: [0, -1.5, 1.5, -1, 1, 0] } : undefined}
        transition={detected ? { duration: 0.32, ease: "easeOut" } : undefined}
      >
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(91,122,47,0.14),rgba(232,228,217,0.65))] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-tight text-foreground">{title}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {subtitle}
              </p>
            </div>
            <span className="rounded-full bg-white/55 px-3 py-1 text-[10px] font-semibold text-foreground/75 ring-1 ring-black/5">
              {tag}
            </span>
          </div>

          {/* Single centered QR */}
          <div className="mt-4 flex items-center justify-center py-1">
            <div
              className={cn(
                "relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white/70 ring-1 ring-white/70",
                detected && "shadow-[0_0_0_8px_rgba(122,158,74,0.18)]"
              )}
            >
              <div className="pointer-events-none absolute inset-2 rounded-2xl bg-[linear-gradient(135deg,rgba(45,58,26,0.12),rgba(45,58,26,0.04))]" />
              <QrCode className="relative h-10 w-10 text-primary" />
            </div>
          </div>

          {/* camera overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" />
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-white/55" />

          {/* scan line */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-4 right-4 h-0.5 rounded-full bg-primary/70 blur-[0.3px]"
            animate={{ top: ["36%", "78%", "36%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ opacity: 0.75 }}
          />
        </div>
      </motion.div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-card/70 px-4 py-3 ring-1 ring-border/60 backdrop-blur">
        <p className="text-xs font-medium text-foreground">{detected ? "QR detected" : "Scanning QR…"}</p>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
            detected
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {detected ? statusText : "Searching"}
        </span>
      </div>
    </div>
  );
}

function FoodCard({
  name,
  price,
  highlight,
  onAddLabel,
}: {
  name: string;
  price: string;
  highlight?: boolean;
  onAddLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-card/80 p-3 ring-1 ring-border/60 backdrop-blur",
        highlight && "ring-primary/40 shadow-[0_18px_40px_rgba(91,122,47,0.14)]"
      )}
    >
      <div className="h-12 w-12 rounded-xl bg-[linear-gradient(135deg,rgba(91,122,47,0.14),rgba(232,228,217,0.75))]" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{price}</p>
      </div>
      <button
        type="button"
        className={cn(
          "rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm",
          highlight && "shadow-lg shadow-primary/25"
        )}
      >
        {onAddLabel ?? "Add"}
      </button>
    </div>
  );
}

function SceneMenu({
  cartCount,
  showConfirmed,
  showCheckout,
}: {
  cartCount: number;
  showConfirmed: boolean;
  showCheckout: boolean;
}) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between rounded-2xl bg-card/70 px-4 py-3 ring-1 ring-border/60 backdrop-blur">
        <div>
          <BrandText className="text-sm font-extrabold tracking-tight" />
          <p className="text-[11px] text-muted-foreground">Menu · Table 12</p>
        </div>
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0, y: -2 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.6, opacity: 0, y: -2 }}
                transition={{ duration: 0.25, ease: easeOutExpo }}
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-lg shadow-primary/30"
              >
                {cartCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {["Coffee", "Pastries", "Lunch"].map((c, i) => (
          <span
            key={c}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              i === 0
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground"
            )}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <FoodCard name="Avocado Bowl" price="CHF 12.50" />
        <FoodCard name="Garden Wrap" price="CHF 9.90" highlight onAddLabel="Add +" />
        <FoodCard name="Herb Lemonade" price="CHF 4.50" />
      </div>

      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.45, ease: easeOutExpo }}
            className="absolute inset-0 flex items-end justify-center rounded-3xl bg-[rgba(26,34,18,0.35)] p-4 backdrop-blur"
          >
            <div className="w-full rounded-3xl bg-card/92 p-4 ring-1 ring-white/25 shadow-floating">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Checkout</p>
                <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Secure
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-2xl bg-muted/70 px-3 py-2 text-[11px]">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-semibold text-foreground">1</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/70 px-3 py-2 text-[11px]">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold text-foreground">CHF 9.90</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-[var(--hero-bg)] px-3 py-3">
                <span className="text-xs font-medium text-foreground">Pay & confirm</span>
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
                  Confirm
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.45, ease: easeOutExpo }}
            className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[rgba(26,34,18,0.55)] p-4 backdrop-blur"
          >
            <div className="confetti" aria-hidden>
              {Array.from({ length: 10 }).map((_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${8 + i * 9}%`,
                    background:
                      i % 3 === 0
                        ? "rgba(122,158,74,0.45)"
                        : i % 3 === 1
                          ? "rgba(232,228,217,0.45)"
                          : "rgba(91,122,47,0.45)",
                    animationDelay: `${i * 55}ms`,
                  }}
                />
              ))}
            </div>
            <div className="w-full rounded-3xl bg-card/90 p-5 text-center ring-1 ring-white/30 shadow-floating">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                Order confirmed
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your kitchen has received the ticket.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SceneBooking({ reserved }: { reserved: boolean }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between rounded-2xl bg-card/70 px-4 py-3 ring-1 ring-border/60 backdrop-blur">
        <div>
          <p className="text-xs font-semibold text-foreground">Book a table</p>
          <p className="text-[11px] text-muted-foreground">
            Choose your time in seconds
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Calendar className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-card/80 p-4 ring-1 ring-border/60 backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Select date
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["Fri 12", "Sat 13", "Sun 14"].map((d, i) => (
            <span
              key={d}
              className={cn(
                "flex items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold",
                i === 1
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {d}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Select time
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["6:30", "7:00", "7:30", "8:00", "8:30", "9:00"].map((t, i) => (
            <span
              key={t}
              className={cn(
                "flex items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold",
                i === 2
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--hero-bg)] px-3 py-3">
          <p className="text-xs font-medium text-foreground">2 guests · Indoors</p>
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm">
            Confirm
          </span>
        </div>
      </div>

      <AnimatePresence>
        {reserved && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.45, ease: easeOutExpo }}
            className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[rgba(26,34,18,0.55)] p-4 backdrop-blur"
          >
            <div className="w-full rounded-3xl bg-card/90 p-5 text-center ring-1 ring-white/30 shadow-floating">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                Table reserved successfully
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                We’ll see you at 7:30 pm.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PhoneDemo() {
  const prefersReduced = useReducedMotion();
  const [scene, setScene] = useState<Scene>("scanMenu");
  const [scanDetected, setScanDetected] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [reserved, setReserved] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const sequence = useMemo(
    () => [
      { scene: "scanMenu" as const, duration: 3200 },
      { scene: "menu" as const, duration: 5200 },
      { scene: "scanBooking" as const, duration: 3200 },
      { scene: "booking" as const, duration: 5000 },
    ],
    []
  );

  useEffect(() => {
    if (prefersReduced) return;

    let idx = 0;
    let timer: number | null = null;

    const run = () => {
      const next = sequence[idx];
      setScene(next.scene);

      // reset per scene
      setScanDetected(false);
      setCartCount(0);
      setOrderConfirmed(false);
      setShowCheckout(false);
      setReserved(false);

      // scene micro-timings
      if (next.scene === "scanMenu" || next.scene === "scanBooking") {
        window.setTimeout(() => setScanDetected(true), 1600);
      }
      if (next.scene === "menu") {
        window.setTimeout(() => setCartCount(1), 1400);
        window.setTimeout(() => setShowCheckout(true), 2400);
        window.setTimeout(() => setShowCheckout(false), 3300);
        window.setTimeout(() => setOrderConfirmed(true), 3200);
        window.setTimeout(() => setOrderConfirmed(false), 4600);
      }
      if (next.scene === "booking") {
        window.setTimeout(() => setReserved(true), 3000);
        window.setTimeout(() => setReserved(false), 4400);
      }

      timer = window.setTimeout(() => {
        idx = (idx + 1) % sequence.length;
        run();
      }, next.duration);
    };

    run();

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [prefersReduced, sequence]);

  useEffect(() => {
    if (prefersReduced) return;
    const el = wrapperRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      // ultra subtle translate only (no rotation)
      setParallax({ x: dx * 6, y: dy * 6 });
    };

    const onLeave = () => setParallax({ x: 0, y: 0 });

    window.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [prefersReduced]);

  // Reduced motion: show a stable menu state.
  const stableScene: Scene = prefersReduced ? "menu" : scene;

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px]">
      <div
        className="transform-gpu transition-transform duration-300"
        style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
      >
        <IPhone15ProFrame animated={!prefersReduced}>
          <AnimatePresence mode="wait">
        {(stableScene === "scanMenu" || stableScene === "scanBooking") && (
          <motion.div
            key={stableScene}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
          >
            <SceneScan
              detected={scanDetected}
              mode={stableScene === "scanBooking" ? "booking" : "menu"}
            />
          </motion.div>
        )}

        {stableScene === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
          >
            <SceneMenu
              cartCount={prefersReduced ? 1 : cartCount}
              showConfirmed={prefersReduced ? false : orderConfirmed}
              showCheckout={prefersReduced ? false : showCheckout}
            />
          </motion.div>
        )}

        {stableScene === "booking" && (
          <motion.div
            key="booking"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
          >
            <SceneBooking reserved={reserved} />
          </motion.div>
        )}
          </AnimatePresence>
        </IPhone15ProFrame>
      </div>
    </div>
  );
}


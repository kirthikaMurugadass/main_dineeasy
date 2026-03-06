"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useI18n } from "@/lib/i18n/context";
import type { Language } from "@/types/database";
import { Button } from "@/components/ui/button";

function getDisplayTitle(
  titleRecord: Record<Language, string> | undefined,
  lang: Language
): string {
  if (!titleRecord) return "";
  const order: Language[] = [lang, "de", "en", "fr", "it"];
  for (const l of order) {
    const v = titleRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return "";
}

export default function CartPage({
  params,
}: {
  params: Promise<{ restaurant: string; menuId: string }>;
}) {
  const router = useRouter();
  const { language } = useI18n();
  const [resolvedParams, setResolvedParams] = useState<{
    restaurant: string;
    menuId: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const {
    items,
    updateQuantity,
    removeItem,
    getTotal,
    getItemCount,
    restaurantSlug,
    menuId: cartMenuId,
  } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    params.then((p) => {
      setResolvedParams(p);
      if (p.restaurant !== restaurantSlug || p.menuId !== cartMenuId) {
        router.push(`/public-menu/${p.restaurant}/${p.menuId}`);
      }
    });
  }, [mounted, params, restaurantSlug, cartMenuId, router]);

  if (!mounted || !resolvedParams) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-semibold">Your cart is empty</h1>
          <p className="mb-6 text-muted-foreground">
            Add some items from the menu to get started
          </p>
          {resolvedParams && (
            <Link
              href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`}
            >
              <Button>Back to Menu</Button>
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {resolvedParams && (
              <Link
                href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}`}
              >
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <div>
              <h1 className="text-3xl font-bold">Your Cart</h1>
              <p className="text-muted-foreground">
                {getItemCount()} {getItemCount() === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="mb-8 space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row"
            >
              {/* Item Image */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={getDisplayTitle(item.title, language)}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <span className="text-2xl opacity-40">◆</span>
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {getDisplayTitle(item.title, language)}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground">
                      CHF {item.price.toFixed(2)} each
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (item.quantity === 1) {
                          removeItem(item.id);
                        } else {
                          updateQuantity(item.id, item.quantity - 1);
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-accent"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="text-lg font-bold">
                    CHF {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total and Checkout */}
        <div className="sticky bottom-0 rounded-2xl border border-border/60 bg-card p-4 shadow-lg sm:p-6">
          <div className="mb-6 flex items-center justify-between text-base sm:text-lg">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold sm:text-2xl">CHF {total.toFixed(2)}</span>
          </div>
          {resolvedParams && (
            <Link
              href={`/public-menu/${resolvedParams.restaurant}/${resolvedParams.menuId}/checkout`}
              className="block w-full"
            >
              <Button size="lg" className="w-full">
                Proceed to Checkout
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

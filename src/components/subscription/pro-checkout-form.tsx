"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type BillingCycle = "monthly" | "annual";

interface ProCheckoutFormProps {
  defaultBilling?: BillingCycle;
  onSuccess?: () => void;
  /** If true, show as compact modal content; if false, full checkout page */
  compact?: boolean;
}

export function ProCheckoutForm({
  defaultBilling = "monthly",
  onSuccess,
  compact = false,
}: ProCheckoutFormProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(defaultBilling);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);

  const isAnnual = billingCycle === "annual";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle }),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed");
      }
      if (data.alreadyPro) {
        toast.success("You already have Pro.");
        onSuccess?.();
        return;
      }
      toast.success("Pro plan activated. You now have access to Orders, Tables & Bookings.");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-center gap-2 rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-xs font-medium text-muted-foreground">
        <span
          className={`cursor-pointer rounded-full px-3 py-1 transition ${!isAnnual ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => setBillingCycle("monthly")}
        >
          Monthly
        </span>
        <span
          className={`cursor-pointer rounded-full px-3 py-1 transition ${isAnnual ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => setBillingCycle("annual")}
        >
          Annual
          <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
            Save 17%
          </span>
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-number">Card number</Label>
        <Input
          id="card-number"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
          maxLength={19}
          className="font-mono"
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry</Label>
          <Input
            id="expiry"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, "");
              if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
              setExpiry(v.slice(0, 5));
            }}
            maxLength={5}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            placeholder="123"
            type="password"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            disabled={loading}
          />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Sample payment — no real charge. For demo only.
      </p>
      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-xl"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
}

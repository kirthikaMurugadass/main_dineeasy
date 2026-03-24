import { Suspense } from "react";
import { PaymentSuccessClient } from "./payment-success-client";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-sm">Confirming your order…</span>
          </div>
        </div>
      }
    >
      <PaymentSuccessClient />
    </Suspense>
  );
}


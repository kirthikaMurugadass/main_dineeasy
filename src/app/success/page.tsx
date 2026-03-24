import { Suspense } from "react";
import { SuccessClient } from "./success-client";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-sm">Processing…</span>
          </div>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}


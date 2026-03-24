import { Suspense } from "react";
import { CancelClient } from "./cancel-client";

export default function CancelPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Payment cancelled</h1>
          <p className="text-sm text-muted-foreground">
            No charges were made. You can try again whenever you’re ready.
          </p>
        </div>
      }
    >
      <CancelClient />
    </Suspense>
  );
}


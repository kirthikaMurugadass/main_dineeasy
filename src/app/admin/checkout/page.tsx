import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminCheckoutClient } from "./checkout-client";

export default async function AdminCheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ billing?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminCheckoutClient billing={sp?.billing} />
    </Suspense>
  );
}

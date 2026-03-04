import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SignupClient } from "./signup-client";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string; billing?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      }
    >
      <SignupClient plan={sp?.plan} billing={sp?.billing} />
    </Suspense>
  );
}

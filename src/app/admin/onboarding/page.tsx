import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminOnboardingClient } from "./onboarding-client";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ plan?: string; billing?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminOnboardingClient
        plan={sp?.plan}
        billing={sp?.billing}
      />
    </Suspense>
  );
}

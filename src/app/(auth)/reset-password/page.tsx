import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ResetPasswordClient } from "./reset-password-client";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      }
    >
      <ResetPasswordClient token={sp?.token} />
    </Suspense>
  );
}

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminLoginClient } from "./login-client";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ registered?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-gold" size={24} />
        </div>
      }
    >
      <AdminLoginClient registered={sp?.registered} />
    </Suspense>
  );
}
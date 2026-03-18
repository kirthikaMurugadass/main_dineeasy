"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ConfirmationStatus = "loading" | "success" | "error";

function AuthConfirmedContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [secondsLeft, setSecondsLeft] = useState(3);
  const nextPath = useMemo(() => {
    const nextPathRaw = searchParams.get("next") || "/";
    return nextPathRaw.startsWith("/") ? nextPathRaw : "/";
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function checkSessionAndStatus() {
      const supabase = createClient();
      const expectedStatus = searchParams.get("status");
      const { data, error } = await supabase.auth.getSession();
      console.log("Confirmation session:", data, error);

      if (cancelled) return;
      if (expectedStatus === "success") {
        setStatus("success");
        return;
      }
      setStatus(error ? "error" : data.session ? "success" : "error");
    }

    checkSessionAndStatus();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (status !== "success") return;
    if (secondsLeft <= 0) {
      window.location.href = `${nextPath}?confirmed=1`;
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [status, secondsLeft, nextPath]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Finalizing email confirmation...
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Your email has been confirmed successfully
            </h1>
            <p className="text-sm text-muted-foreground">
              Redirecting to home in {secondsLeft}s...
            </p>
            <div className="pt-1">
              <Link href={nextPath} className="text-sm font-medium text-primary hover:underline">
                Go now
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              We could not confirm your email link
            </h1>
            <p className="text-sm text-muted-foreground">
              Please retry the confirmation link or continue to the latest home page.
            </p>
            <div className="pt-1">
              <Link href="/" className="text-sm font-medium text-primary hover:underline">
                Go to home page
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthConfirmedFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Finalizing email confirmation...
        </div>
      </div>
    </div>
  );
}

export default function AuthConfirmedPage() {
  return (
    <Suspense fallback={<AuthConfirmedFallback />}>
      <AuthConfirmedContent />
    </Suspense>
  );
}

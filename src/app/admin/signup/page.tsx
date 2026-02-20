"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

/**
 * Legacy admin signup page - redirects to new auth signup
 * This page is kept for backward compatibility
 */
export default function AdminSignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup");
  }, [router]);

  return null;
}

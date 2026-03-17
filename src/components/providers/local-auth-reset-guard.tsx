"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function isLocalSupabaseUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    const isLocalHost = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    return isLocalHost && (parsed.port === "54321" || parsed.port === "");
  } catch {
    return false;
  }
}

function clearSupabaseStorage() {
  const shouldRemove = (key: string) =>
    key.startsWith("sb-") || key.toLowerCase().includes("supabase");

  for (const key of Object.keys(window.localStorage)) {
    if (shouldRemove(key)) window.localStorage.removeItem(key);
  }
  for (const key of Object.keys(window.sessionStorage)) {
    if (shouldRemove(key)) window.sessionStorage.removeItem(key);
  }
}

export function LocalAuthResetGuard() {
  useEffect(() => {
    if (!isLocalSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) return;

    const supabase = createClient();
    let cancelled = false;

    const verifySession = async () => {
      const { error } = await supabase.auth.getUser();
      if (cancelled || !error) return;

      // Local DB reset removes auth users; if token is stale, clear it client-side.
      clearSupabaseStorage();
      await supabase.auth.signOut();
    };

    verifySession();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

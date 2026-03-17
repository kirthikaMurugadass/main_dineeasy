import { createBrowserClient } from "@supabase/ssr";

function isLocalSupabaseUrl(url: URL) {
  return (
    (url.hostname === "127.0.0.1" || url.hostname === "localhost") &&
    (url.port === "54321" || url.port === "")
  );
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file, then restart the dev server."
    );
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("Invalid protocol");
    }
    const isHostedSupabase =
      parsed.hostname.includes("supabase") || parsed.hostname.endsWith(".supabase.co");
    const isLocalSupabase = isLocalSupabaseUrl(parsed);
    if (!isHostedSupabase && !isLocalSupabase) {
      console.warn(
        "[Supabase] NEXT_PUBLIC_SUPABASE_URL does not look like a valid hosted or local Supabase URL. Check your .env.local."
      );
    }
  } catch (e) {
    if (e instanceof TypeError || (e instanceof Error && e.message === "Invalid protocol")) {
      throw new Error(
        "Invalid NEXT_PUBLIC_SUPABASE_URL. It must be a valid URL (e.g. https://your-project.supabase.co)."
      );
    }
    throw e;
  }

  return { url, key };
}

export function createClient() {
  const { url, key } = getSupabaseConfig();
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  }
  return createBrowserClient(url, key);
}

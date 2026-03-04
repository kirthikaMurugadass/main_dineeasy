import { createBrowserClient } from "@supabase/ssr";

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
    if (!parsed.hostname.includes("supabase") && !parsed.hostname.endsWith(".supabase.co")) {
      console.warn(
        "[Supabase] NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase URL (e.g. https://xxxx.supabase.co). Check your .env.local."
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
  return createBrowserClient(url, key);
}

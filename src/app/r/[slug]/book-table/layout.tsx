import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { defaultThemeConfig, type ThemeConfig } from "@/types/database";
import { PublicThemeProvider } from "@/components/providers/public-theme-provider";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function BookTableLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("restaurants")
    .select("theme_config")
    .eq("slug", slug)
    .single();

  const rawTheme = ((data?.theme_config as ThemeConfig | null) || defaultThemeConfig) as ThemeConfig;
  const themeConfig: ThemeConfig = {
    ...defaultThemeConfig,
    ...(rawTheme.bookTableAppearance || {}),
  };

  return (
    <PublicThemeProvider restaurantSlug={`${slug}:book-table`} themeConfig={themeConfig}>
      {children}
    </PublicThemeProvider>
  );
}


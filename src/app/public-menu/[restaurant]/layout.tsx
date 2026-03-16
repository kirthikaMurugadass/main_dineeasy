import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { defaultThemeConfig, type ThemeConfig } from "@/types/database";
import { PublicThemeProvider } from "@/components/providers/public-theme-provider";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ restaurant: string }>;
}

export default async function PublicRestaurantLayout({
  children,
  params,
}: LayoutProps) {
  const { restaurant } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("restaurants")
    .select("theme_config")
    .eq("slug", restaurant)
    .single();

  const mergedTheme: ThemeConfig = {
    ...defaultThemeConfig,
    ...((data?.theme_config as ThemeConfig | null) || {}),
  };

  return (
    <PublicThemeProvider restaurantSlug={restaurant} themeConfig={mergedTheme}>
      {children}
    </PublicThemeProvider>
  );
}


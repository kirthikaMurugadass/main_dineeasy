import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicMenuView } from "@/components/menu/public-menu-view";
import { PreviewBanner } from "@/components/menu/preview-banner";
import type { PublicRestaurantData, Language, ThemeConfig } from "@/types/database";
import { defaultThemeConfig } from "@/types/database";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ restaurant: string; menuId: string }>;
  searchParams: Promise<{ config?: string; iframe?: string; lang?: string }>;
}

async function getRestaurantDataForPreview(
  restaurantSlug: string,
  menuId: string
): Promise<PublicRestaurantData | null> {
  const supabase = await createClient();

  // Fetch restaurant by slug
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url, theme_config")
    .eq("slug", restaurantSlug)
    .single();

  if (!restaurant) return null;

  // Fetch the specific menu by ID
  const { data: menu } = await supabase
    .from("menus")
    .select("id, slug, is_active")
    .eq("id", menuId)
    .eq("restaurant_id", restaurant.id)
    .single();

  if (!menu || !menu.is_active) {
    return null;
  }

  // Fetch categories for this menu (try with image_url; fallback without if migration not run)
  let categories: { id: string; menu_id: string; sort_order: number; is_active: boolean; image_url?: string | null }[];
  const resWithImage = await supabase
    .from("categories")
    .select("id, menu_id, sort_order, is_active, image_url")
    .eq("menu_id", menu.id)
    .eq("is_active", true)
    .order("sort_order");

  if (resWithImage.error) {
    const resWithout = await supabase
      .from("categories")
      .select("id, menu_id, sort_order, is_active")
      .eq("menu_id", menu.id)
      .eq("is_active", true)
      .order("sort_order");
    categories = (resWithout.data ?? []).map((c) => ({ ...c, image_url: null }));
  } else {
    categories = resWithImage.data ?? [];
  }

  if (!categories.length) {
    const result: PublicRestaurantData = {
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        theme_config: restaurant.theme_config,
      },
      categories: [],
      availableLanguages: ["de", "en", "fr", "it"],
    };
    return result;
  }

  const categoryIds = categories.map((c) => c.id);

  // Fetch items for these categories
  const { data: items } = await supabase
    .from("menu_items")
    .select("id, category_id, price_chf, image_url, sort_order")
    .in("category_id", categoryIds)
    .eq("is_active", true)
    .order("sort_order");

  // Fetch translations for all categories and items
  const entityIds = [
    ...categoryIds,
    ...(items?.map((i) => i.id) ?? []),
  ];

  const { data: translations } = await supabase
    .from("translations")
    .select("entity_type, entity_id, language, title, description")
    .in("entity_id", entityIds)
    .in("entity_type", ["category", "menu_item"]);

  const translationMap = new Map<
    string,
    Map<string, { title: string; description: string | null }>
  >();
  translations?.forEach((tr) => {
    if (!translationMap.has(tr.entity_id)) {
      translationMap.set(tr.entity_id, new Map());
    }
    translationMap.get(tr.entity_id)!.set(tr.language, {
      title: tr.title,
      description: tr.description,
    });
  });

  function getTranslationRecord(
    entityId: string,
    field: "title" | "description"
  ) {
    const langMap = translationMap.get(entityId);
    const result: Record<string, string | null> = {};
    for (const lang of ["de", "en", "fr", "it"] as Language[]) {
      const tr = langMap?.get(lang);
      result[lang] = tr ? tr[field] : field === "title" ? "" : null;
    }
    return result;
  }

  // Assemble public data
  const publicData: PublicRestaurantData = {
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      logo_url: restaurant.logo_url,
      theme_config: restaurant.theme_config, // Will be overridden by preview config
    },
    categories: categories.map((cat) => ({
      id: cat.id,
      sort_order: cat.sort_order,
      image_url: cat.image_url ?? null,
      title: getTranslationRecord(cat.id, "title") as Record<Language, string>,
      description: getTranslationRecord(cat.id, "description") as Record<
        Language,
        string | null
      >,
      items: (items ?? [])
        .filter((i) => i.category_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          price_chf: item.price_chf,
          image_url: item.image_url,
          sort_order: item.sort_order,
          title: getTranslationRecord(item.id, "title") as Record<
            Language,
            string
          >,
          description: getTranslationRecord(item.id, "description") as Record<
            Language,
            string | null
          >,
        })),
    })),
    availableLanguages: ["de", "en", "fr", "it"],
  };

  return publicData;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { restaurant } = await params;
  return {
    title: `Preview — ${restaurant}`,
    robots: "noindex, nofollow", // Don't index preview pages
  };
}

// Preview pages are dynamic by default

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const { restaurant, menuId } = await params;
  const { config: configParam, iframe, lang } = await searchParams;
  const isIframe = iframe === "true";
  const validatedLang = lang && ["de", "en", "fr", "it"].includes(lang) ? (lang as Language) : undefined;

  // Decode preview config from URL
  let previewConfig: ThemeConfig & { logoUrl?: string | null } | null = null;
  if (configParam) {
    try {
      const decoded = JSON.parse(atob(configParam));
      previewConfig = decoded as ThemeConfig & { logoUrl?: string | null };
    } catch {
      // Invalid config, ignore
    }
  }

  const data = await getRestaurantDataForPreview(restaurant, menuId);

  if (!data) notFound();

  // Override theme_config with preview config if provided
  if (previewConfig) {
    // Extract logoUrl before merging (it's not part of ThemeConfig)
    const { logoUrl, ...themeConfigFromPreview } = previewConfig;
    
    // Merge with defaults and existing config to ensure all required fields are present
    data.restaurant.theme_config = {
      ...defaultThemeConfig,
      ...(data.restaurant.theme_config || {}),
      ...themeConfigFromPreview,
      // Ensure typography is always set from preview config if provided
      typography: previewConfig.typography || data.restaurant.theme_config?.typography,
    } as ThemeConfig;
    
    // Override logo_url if provided in preview config (for instant updates)
    if (logoUrl !== undefined) {
      data.restaurant.logo_url = logoUrl;
    }
    // Hero banner config is already included in previewConfig.heroBanner
  }

  // Adapt PublicRestaurantData to PublicMenu format for the shared view
  const viewData = {
    ...data,
    menu: { id: menuId, slug: restaurant },
  };

  // For iframe mode, wrap in a container that ensures proper rendering
  if (isIframe) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "transparent" }}>
        <PublicMenuView data={viewData} initialLang={validatedLang} />
      </div>
    );
  }

  return (
    <>
      <PreviewBanner restaurantSlug={restaurant} menuId={menuId} />
      <PublicMenuView data={viewData} initialLang={validatedLang} />
    </>
  );
}

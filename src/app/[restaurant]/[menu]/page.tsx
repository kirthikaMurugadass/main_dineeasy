import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCachedMenu, setCachedMenu } from "@/lib/redis";
import { PublicMenuView } from "@/components/menu/public-menu-view";
import type { PublicMenu, Language } from "@/types/database";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ restaurant: string; menu: string }>;
}

async function getMenuData(
  restaurantSlug: string,
  menuSlug: string
): Promise<PublicMenu | null> {
  // Try Redis cache first
  const cacheKey = `${restaurantSlug}:${menuSlug}`;
  const cached = await getCachedMenu(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Cache corrupted, continue to DB
    }
  }

  const supabase = await createClient();

  // Fetch restaurant
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url, theme_config")
    .eq("slug", restaurantSlug)
    .single();

  if (!restaurant) return null;

  // Fetch menu
  const { data: menu } = await supabase
    .from("menus")
    .select("id, slug, is_active")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", menuSlug)
    .eq("is_active", true)
    .single();

  if (!menu) return null;

  // Fetch categories with items
  const { data: categories } = await supabase
    .from("categories")
    .select("id, sort_order, is_active")
    .eq("menu_id", menu.id)
    .eq("is_active", true)
    .order("sort_order");

  if (!categories?.length) {
    const result: PublicMenu = {
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        theme_config: restaurant.theme_config,
      },
      menu: { id: menu.id, slug: menu.slug },
      categories: [],
      availableLanguages: ["de", "en", "fr", "it"],
    };
    await setCachedMenu(cacheKey, JSON.stringify(result));
    return result;
  }

  const categoryIds = categories.map((c) => c.id);

  // Fetch items for all categories
  const { data: items } = await supabase
    .from("menu_items")
    .select("id, category_id, price_chf, image_url, sort_order")
    .in("category_id", categoryIds)
    .eq("is_active", true)
    .order("sort_order");

  // Fetch translations for categories and items
  const entityIds = [
    ...categoryIds,
    ...(items?.map((i) => i.id) ?? []),
  ];

  const { data: translations } = await supabase
    .from("translations")
    .select("entity_type, entity_id, language, title, description")
    .in("entity_id", entityIds);

  const translationMap = new Map<string, Map<string, { title: string; description: string | null }>>();
  translations?.forEach((tr) => {
    if (!translationMap.has(tr.entity_id)) {
      translationMap.set(tr.entity_id, new Map());
    }
    translationMap.get(tr.entity_id)!.set(tr.language, {
      title: tr.title,
      description: tr.description,
    });
  });

  function getTranslationRecord(entityId: string, field: "title" | "description") {
    const langMap = translationMap.get(entityId);
    const result: Record<Language, string | (typeof field extends "title" ? never : null)> = {} as Record<Language, string>;
    for (const lang of ["de", "en", "fr", "it"] as Language[]) {
      const tr = langMap?.get(lang);
      (result as Record<string, string | null>)[lang] = tr ? tr[field] : (field === "title" ? "" : null);
    }
    return result;
  }

  // Assemble
  const publicMenu: PublicMenu = {
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      logo_url: restaurant.logo_url,
      theme_config: restaurant.theme_config,
    },
    menu: { id: menu.id, slug: menu.slug },
    categories: categories.map((cat) => ({
      id: cat.id,
      sort_order: cat.sort_order,
      title: getTranslationRecord(cat.id, "title") as Record<Language, string>,
      description: getTranslationRecord(cat.id, "description") as Record<Language, string | null>,
      items: (items ?? [])
        .filter((i) => i.category_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          price_chf: item.price_chf,
          image_url: item.image_url,
          sort_order: item.sort_order,
          title: getTranslationRecord(item.id, "title") as Record<Language, string>,
          description: getTranslationRecord(item.id, "description") as Record<Language, string | null>,
        })),
    })),
    availableLanguages: ["de", "en", "fr", "it"],
  };

  // Cache the result
  await setCachedMenu(cacheKey, JSON.stringify(publicMenu));

  return publicMenu;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { restaurant, menu } = await params;
  const data = await getMenuData(restaurant, menu);

  if (!data) return { title: "Menu not found" };

  return {
    title: `${data.restaurant.name} — Menu`,
    description: `View the digital menu of ${data.restaurant.name}. Browse categories, prices in CHF, and multilingual descriptions.`,
    openGraph: {
      title: `${data.restaurant.name} — Digital Menu`,
      description: `Browse the menu of ${data.restaurant.name}`,
      type: "website",
    },
  };
}

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export default async function PublicMenuPage({ params }: PageProps) {
  const { restaurant, menu: menuSlug } = await params;
  const data = await getMenuData(restaurant, menuSlug);

  if (!data) notFound();

  return <PublicMenuView data={data} />;
}

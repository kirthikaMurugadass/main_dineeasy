import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCachedMenu, setCachedMenu } from "@/lib/redis";
import { PublicMenuView } from "@/components/menu/public-menu-view";
import type { PublicRestaurantData, Language } from "@/types/database";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ restaurant: string }>;
}

async function getRestaurantDataBySlug(
  restaurantSlug: string,
  menuId?: string
): Promise<PublicRestaurantData | null> {
  // Try Redis cache first (skip in development for instant updates)
  const cacheKey = `restaurant:${restaurantSlug}${menuId ? `:${menuId}` : ""}`;
  const cached = process.env.NODE_ENV === "development" 
    ? null 
    : await getCachedMenu(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Cache corrupted, continue to DB
    }
  }

  const supabase = await createClient();

  // Fetch restaurant by slug (subdomain)
  // Use cache: 'no-store' to ensure fresh typography config
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url, theme_config")
    .eq("slug", restaurantSlug)
    .single();

  if (!restaurant) return null;

  // If menuId is provided, fetch that specific menu
  // Otherwise, fetch the active menu
  let menu;
  if (menuId) {
    const { data: menuData } = await supabase
      .from("menus")
      .select("id, slug, is_active")
      .eq("id", menuId)
      .eq("restaurant_id", restaurant.id)
      .single();
    menu = menuData;
  } else {
    // Get the active menu (or first menu if none active)
    const { data: menus } = await supabase
      .from("menus")
      .select("id, slug, is_active")
      .eq("restaurant_id", restaurant.id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1);
    menu = menus?.[0] || null;
  }

  if (!menu) {
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
    await setCachedMenu(cacheKey, JSON.stringify(result));
    return result;
  }

  // Only show active menus
  if (!menu.is_active) {
    return null;
  }

  // Fetch categories for this menu
  const { data: categories } = await supabase
    .from("categories")
    .select("id, menu_id, sort_order, is_active")
    .eq("menu_id", menu.id)
    .eq("is_active", true)
    .order("sort_order");

  if (!categories?.length) {
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
    await setCachedMenu(cacheKey, JSON.stringify(result));
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
      theme_config: restaurant.theme_config,
    },
    categories: categories.map((cat) => ({
      id: cat.id,
      sort_order: cat.sort_order,
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

  // Cache the result
  await setCachedMenu(cacheKey, JSON.stringify(publicData));

  return publicData;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { restaurant } = await params;
  const data = await getRestaurantDataBySlug(restaurant);

  if (!data) return { title: "Restaurant not found" };

  return {
    title: `${data.restaurant.name} — Digital Menu`,
    description: `View the digital menu of ${data.restaurant.name}. Browse categories, prices in CHF, and multilingual descriptions.`,
    openGraph: {
      title: `${data.restaurant.name} — Digital Menu`,
      description: `Browse the menu of ${data.restaurant.name}`,
      type: "website",
    },
  };
}

// Disable caching for public menu pages to ensure fresh data (especially typography)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function SubdomainMenuPage({ params }: PageProps) {
  const { restaurant } = await params;
  const data = await getRestaurantDataBySlug(restaurant);

  if (!data) notFound();

  // Adapt PublicRestaurantData to PublicMenu format for the shared view
  const viewData = {
    ...data,
    menu: { id: "subdomain-menu", slug: restaurant },
  };

  return <PublicMenuView data={viewData} />;
}

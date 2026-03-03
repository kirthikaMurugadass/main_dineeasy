import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicMenuView } from "@/components/menu/public-menu-view";
import type { PublicRestaurantData, Language } from "@/types/database";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getRestaurantData(
  slug: string
): Promise<PublicRestaurantData | null> {
  const supabase = await createClient();

  // Fetch restaurant by slug
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url, theme_config, plan_type, plan_status")
    .eq("slug", slug)
    .single();

  if (!restaurant) return null;

  // Fetch ALL active menus for this restaurant
  const { data: menus } = await supabase
    .from("menus")
    .select("id, slug, is_active")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true);

  if (!menus?.length) {
    const result: PublicRestaurantData = {
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url,
        theme_config: restaurant.theme_config,
        plan_type: restaurant.plan_type ?? "free",
        plan_status: restaurant.plan_status ?? "active",
      },
      categories: [],
      availableLanguages: ["de", "en", "fr", "it"],
    };
    return result;
  }

  const menuIds = menus.map((m) => m.id);

  // Fetch ALL categories across all active menus
  // Try with image_url; fallback without if column doesn't exist (migration not run)
  let categories: { id: string; menu_id: string; sort_order: number; is_active: boolean; image_url?: string | null }[];
  const resWithImage = await supabase
    .from("categories")
    .select("id, menu_id, sort_order, is_active, image_url")
    .in("menu_id", menuIds)
    .eq("is_active", true)
    .order("sort_order");

  if (resWithImage.error) {
    const resWithout = await supabase
      .from("categories")
      .select("id, menu_id, sort_order, is_active")
      .in("menu_id", menuIds)
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
        plan_type: restaurant.plan_type ?? "free",
        plan_status: restaurant.plan_status ?? "active",
      },
      categories: [],
      availableLanguages: ["de", "en", "fr", "it"],
    };
    return result;
  }

  const categoryIds = categories.map((c) => c.id);

  // Fetch ALL items across all categories
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

  // Assemble combined view — all menus merged by category
  const publicData: PublicRestaurantData = {
    restaurant: {
      name: restaurant.name,
      slug: restaurant.slug,
      logo_url: restaurant.logo_url,
      theme_config: restaurant.theme_config,
      plan_type: restaurant.plan_type ?? "free",
      plan_status: restaurant.plan_status ?? "active",
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
  const { slug } = await params;
  const data = await getRestaurantData(slug);

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

// ISR: revalidate every 60 seconds
// Note: In development, Next.js automatically disables caching
export const revalidate = 60;

export default async function RestaurantPublicPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const data = await getRestaurantData(slug);

  if (!data) notFound();

  // Get restaurant ID and first active menu ID for cart functionality
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .single();

  // Get the first active menu ID for cart/checkout
  const { data: menus } = await supabase
    .from("menus")
    .select("id")
    .eq("restaurant_id", restaurant?.id ?? "")
    .eq("is_active", true)
    .limit(1);

  const menuId = menus?.[0]?.id ?? null;

  // Adapt PublicRestaurantData to PublicMenu format for the shared view
  const viewData = {
    ...data,
    menu: { id: menuId ?? "combined", slug },
  };

  return (
    <PublicMenuView
      data={viewData}
      restaurantId={restaurant?.id}
      menuId={menuId}
    />
  );
}

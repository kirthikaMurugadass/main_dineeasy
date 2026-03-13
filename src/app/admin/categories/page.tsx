"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { CategoryCard as CategoryCardComponent } from "@/components/admin/categories/category-card";
import { AddCategoryCard } from "@/components/admin/categories/add-category-card";
import { CategoriesEmptyState } from "@/components/admin/categories/empty-state";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CategoryItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

interface CategoryCard {
  id: string;
  name: string;
  itemCount: number;
  activeItemCount: number;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
  items: CategoryItem[];
  avgPrice: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [categories, setCategories] = useState<CategoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Auto-create menu if it doesn't exist
  const ensureMenuExists = useCallback(async (restaurantId: string) => {
    const supabase = createClient();
    
    // Check if menu exists
    const { data: existingMenu } = await supabase
      .from("menus")
      .select("id, slug, is_active")
      .eq("restaurant_id", restaurantId)
      .limit(1)
      .maybeSingle();

    if (existingMenu) {
      return existingMenu.id;
    }

    // Create menu automatically
    const { data: newMenu, error } = await supabase
      .from("menus")
      .insert({
        restaurant_id: restaurantId,
        slug: "menu",
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      // If conflict (menu already exists), fetch it
      if (error.code === "23505" || error.message?.toLowerCase().includes("unique")) {
        const { data: menu } = await supabase
          .from("menus")
          .select("id")
          .eq("restaurant_id", restaurantId)
          .limit(1)
          .maybeSingle();
        return menu?.id || null;
      }
      console.error("Error creating menu:", error);
      return null;
    }

    return newMenu?.id || null;
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, slug")
        .eq("owner_id", user.id)
        .single();

      if (restaurantError || !restaurant) {
        router.push("/admin/onboarding");
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
      setRestaurantSlug(restaurant.slug);

      // Ensure menu exists (auto-create if needed)
      const menuId = await ensureMenuExists(restaurant.id);
      if (!menuId) {
        toast.error(t.admin.categories.initError);
        setLoading(false);
        return;
      }

      setMenuId(menuId);

      // Load categories with translations and item counts
      // Try with image_url first; if column doesn't exist (migration not run), fallback without it
      let cats: { id: string; sort_order: number; is_active: boolean; image_url?: string | null }[] | null;
      let catsError: { message?: string } | null = null;

      const resultWithImage = await supabase
        .from("categories")
        .select("id, sort_order, is_active, image_url")
        .eq("menu_id", menuId)
        .order("sort_order");

      if (resultWithImage.error) {
        // Column may not exist yet - retry without image_url
        const resultWithoutImage = await supabase
          .from("categories")
          .select("id, sort_order, is_active")
          .eq("menu_id", menuId)
          .order("sort_order");

        if (resultWithoutImage.error) {
          catsError = resultWithoutImage.error;
          cats = null;
        } else {
          cats = (resultWithoutImage.data ?? []).map((c) => ({ ...c, image_url: null }));
        }
      } else {
        cats = resultWithImage.data;
        catsError = null;
      }

      if (catsError) {
        console.error("Error loading categories:", catsError);
        setCategories([]);
        setLoading(false);
        return;
      }

      const categoriesList = cats ?? [];
      if (!categoriesList.length) {
        setCategories([]);
        setLoading(false);
        return;
      }

      // Get item counts and details per category
      const catIds = categoriesList.map((c) => c.id);
      const { data: items } = await supabase
        .from("menu_items")
        .select("id, category_id, price_chf, image_url, is_active")
        .in("category_id", catIds);

      // Get item translations
      const itemIds = items?.map((i) => i.id) ?? [];
      const { data: itemTranslations } = itemIds.length
        ? await supabase
            .from("translations")
            .select("entity_id, language, title")
            .eq("entity_type", "menu_item")
            .in("entity_id", itemIds)
            .eq("language", language)
        : { data: null };

      const itemTranslationMap = new Map(
        itemTranslations?.map((t) => [t.entity_id, t.title]) ?? []
      );

      // Group items by category
      const itemsByCategory = new Map<string, CategoryItem[]>();
      items?.forEach((item) => {
        if (!itemsByCategory.has(item.category_id)) {
          itemsByCategory.set(item.category_id, []);
        }
        itemsByCategory.get(item.category_id)!.push({
          id: item.id,
          name: itemTranslationMap.get(item.id) || "Untitled Item",
          price: item.price_chf,
          image_url: item.image_url,
          is_active: item.is_active,
        });
      });

      // Get category translations
      const { data: translations } = await supabase
        .from("translations")
        .select("entity_id, language, title")
        .eq("entity_type", "category")
        .in("entity_id", catIds)
        .eq("language", language);

      const translationMap = new Map(translations?.map((t) => [t.entity_id, t.title]) ?? []);

      // Build category cards with stats
      const categoryCards: CategoryCard[] = categoriesList.map((cat) => {
        const categoryItems = itemsByCategory.get(cat.id) ?? [];
        const activeItems = categoryItems.filter((i) => i.is_active);
        const totalPrice = categoryItems.reduce((sum, item) => sum + item.price, 0);
        const avgPrice = categoryItems.length > 0 ? totalPrice / categoryItems.length : 0;

        return {
          id: cat.id,
          name: translationMap.get(cat.id) || t.admin.categories.emptyTitle,
          itemCount: categoryItems.length,
          activeItemCount: activeItems.length,
          is_active: cat.is_active,
          sort_order: cat.sort_order,
          image_url: cat.image_url ?? null,
          items: categoryItems,
          avgPrice,
        };
      });

      setCategories(categoryCards);
    } catch (err) {
      console.error("Error in loadCategories:", err);
      toast.error(t.admin.categories.loadError);
    } finally {
      setLoading(false);
    }
  }, [router, language, ensureMenuExists]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function toggleCategoryActive(categoryId: string, currentActive: boolean) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !currentActive })
        .eq("id", categoryId);

      if (error) throw error;
      toast.success(currentActive ? t.admin.menus.inactive : t.admin.menus.active);
      await loadCategories();
    } catch (err) {
      toast.error("Failed to update category");
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm(t.admin.categories.deleteConfirm)) {
      return;
    }

    setDeleting(categoryId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", categoryId);

      if (error) throw error;
      toast.success(t.admin.categories.deleteSuccess);
      await loadCategories();
    } catch (err) {
      toast.error(t.admin.categories.deleteError);
    } finally {
      setDeleting(null);
    }
  }

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const categoryScoped =
      activeCategory === "all"
        ? categories
        : categories.filter((c) => c.id === activeCategory);

    if (!normalizedQuery) return categoryScoped;

    return categoryScoped.filter((c) => {
      const inCategoryName = c.name.toLowerCase().includes(normalizedQuery);
      const inItems = c.items.some((i) =>
        i.name.toLowerCase().includes(normalizedQuery)
      );
      return inCategoryName || inItems;
    });
  }, [categories, activeCategory, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="space-y-4">
          <PageTitle description={t.admin.categories.description}>
            {t.admin.categories.title}
          </PageTitle>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-2xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product here..."
                className="h-11 rounded-2xl pl-10 text-sm"
              />
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
              {restaurantSlug && (
                <a
                  href={`/r/${restaurantSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button variant="outline" className="h-11 gap-2 rounded-2xl w-full sm:w-auto">
                    <ExternalLink size={14} />
                    <span>{t.admin.categories.viewPublic}</span>
                  </Button>
                </a>
              )}
              <Link href="/admin/menu/category/new" className="w-full sm:w-auto">
                <Button className="h-11 gap-2 rounded-2xl bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white dark:hover:bg-primary/90 w-full sm:w-auto">
                  <Plus size={16} />
                  {t.admin.categories.addCategory}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>

      {categories.length === 0 ? (
        <FadeIn delay={0.2}>
          <CategoriesEmptyState />
        </FadeIn>
      ) : (
        <div className="space-y-4">
          {/* Horizontal category list */}
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "snap-start flex min-w-[170px] items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                activeCategory === "all"
                  ? "border-primary/20 bg-primary/10 shadow-card"
                  : "border-border/60 bg-card"
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-xs font-bold">
                C
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate">{t.admin.categories.title}</div>
                <div className="text-xs text-muted-foreground">
                  {categories.reduce((sum, c) => sum + c.itemCount, 0)}{" "}
                  {t.admin.categories.items}
                </div>
              </div>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "snap-start flex min-w-[200px] items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                  activeCategory === cat.id
                    ? "border-primary/20 bg-primary/10 shadow-card"
                    : "border-border/60 bg-card"
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="h-9 w-9 object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {cat.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate">{cat.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {cat.itemCount} {t.admin.categories.items}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Cards grid */}
          <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <StaggerItem key={category.id}>
                <CategoryCardComponent
                  id={category.id}
                  name={category.name}
                  itemCount={category.itemCount}
                  activeItemCount={category.activeItemCount}
                  is_active={category.is_active}
                  image_url={category.image_url}
                  items={category.items}
                  avgPrice={category.avgPrice}
                  language={language}
                  onToggleActive={toggleCategoryActive}
                  onDelete={handleDeleteCategory}
                  deleting={deleting === category.id}
                />
              </StaggerItem>
            ))}

            <StaggerItem>
              <AddCategoryCard />
            </StaggerItem>
          </StaggerContainer>
        </div>
      )}
    </div>
  );
}

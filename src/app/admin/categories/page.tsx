"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";
import { CategoryCard as CategoryCardComponent } from "@/components/admin/categories/category-card";
import { AddCategoryCard } from "@/components/admin/categories/add-category-card";
import { CategoriesEmptyState } from "@/components/admin/categories/empty-state";
import { useI18n } from "@/lib/i18n/context";
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageTitle description={t.admin.categories.description}>
            {t.admin.categories.title}
          </PageTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {restaurantSlug && (
              <a
                href={`/r/${restaurantSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <ExternalLink size={14} />
                  <span>{t.admin.categories.viewPublic}</span>
                </Button>
              </a>
            )}
            <Link href="/admin/menu/category/new" className="w-full sm:w-auto">
              <Button className="gap-2 bg-espresso text-warm hover:bg-espresso/90 dark:bg-espresso dark:text-slate-900 dark:hover:bg-espresso/90 w-full sm:w-auto">
                <Plus size={16} />
                {t.admin.categories.addCategory}
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {categories.length === 0 ? (
        <FadeIn delay={0.2}>
          <CategoriesEmptyState />
        </FadeIn>
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Category Cards */}
          {categories.map((category, index) => (
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

          {/* Add Category Card - After existing categories */}
          <StaggerItem>
            <AddCategoryCard />
          </StaggerItem>
        </StaggerContainer>
      )}
    </div>
  );
}

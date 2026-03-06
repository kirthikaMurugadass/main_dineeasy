"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  GripVertical,
  Trash2,
  Save,
  ArrowLeft,
  Loader2,
  ChevronRight,
  Upload,
  X,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Edit2,
  Copy,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_LANGUAGES, type Dictionary } from "@/lib/i18n/dictionaries";
import { toast } from "sonner";
import type { Language } from "@/types/database";
import { ItemImageUpload } from "@/components/admin/item-image-upload";
import { PageTitle } from "@/components/ui/page-title";
import {
  uploadItemImage,
  deleteItemImage,
  uploadCategoryImage,
  deleteCategoryImage,
} from "@/lib/upload";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ItemTranslation {
  language: Language;
  title: string;
  description: string;
}

interface EditableItem {
  id: string;
  price_chf: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  translations: ItemTranslation[];
  isNew?: boolean;
  _pendingFile?: File;
  _deleteImage?: boolean;
}

function SortableItem({
  item,
  itemIndex,
  onUpdate,
  onRemove,
  langTab,
  saving,
  t,
}: {
  item: EditableItem;
  itemIndex: number;
  onUpdate: (itemIdx: number, updates: Partial<EditableItem>) => void;
  onRemove: (itemIdx: number) => void;
  langTab: Language;
  saving: boolean;
  t: Dictionary;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tr = item.translations.find((t) => t.language === langTab);

  function updateTranslation(field: "title" | "description", value: string) {
    const updated = item.translations.map((t) =>
      t.language === langTab ? { ...t, [field]: value } : t
    );
    onUpdate(itemIndex, { translations: updated });
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group relative rounded-xl border border-border/60 bg-card/90 p-3 sm:p-4 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        {/* Top Row: Drag Handle, Image, and Controls (Mobile) */}
        <div className="flex items-start gap-3 sm:contents">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 sm:mt-3 cursor-grab rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing flex-shrink-0"
          >
            <GripVertical size={18} />
          </button>

          {/* Image Upload */}
          <div className="flex-shrink-0">
            <ItemImageUpload
              imageUrl={item.image_url}
              uploading={saving && !!item._pendingFile}
              disabled={saving}
              size="lg"
              onFileSelected={(file) =>
                onUpdate(itemIndex, {
                  _pendingFile: file,
                  _deleteImage: false,
                })
              }
              onRemove={() =>
                onUpdate(itemIndex, {
                  image_url: null,
                  _pendingFile: undefined,
                  _deleteImage: true,
                })
              }
            />
          </div>

          {/* Controls - Mobile Only (shown on top right) */}
          <div className="flex items-center gap-2 ml-auto sm:hidden">
            <Switch
              checked={item.is_active}
              onCheckedChange={(checked) => onUpdate(itemIndex, { is_active: checked })}
              className="data-[state=checked]:bg-green-500"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(itemIndex)}
              className="h-8 w-8 text-muted-foreground dark:text-muted-foreground hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Item Details */}
        <div className="flex-1 space-y-3 min-w-0">
          <div className="space-y-2">
            <Input
              placeholder={t.admin.categories.menuItemNamePlaceholder}
              value={tr?.title ?? ""}
              onChange={(e) => updateTranslation("title", e.target.value)}
              className="h-10 sm:h-11 text-sm font-medium border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60"
            />
            <Textarea
              placeholder={t.admin.categories.menuItemDescriptionPlaceholder}
              value={tr?.description ?? ""}
              onChange={(e) => updateTranslation("description", e.target.value)}
              className="min-h-[60px] text-xs resize-none border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60"
              maxLength={200}
            />
          </div>
        </div>

        {/* Price & Controls - Desktop */}
        <div className="flex sm:flex-col items-start sm:items-end gap-3 flex-shrink-0 sm:pt-0 pt-0">
          <div className="w-full sm:w-32">
            <Label className="text-xs text-muted-foreground mb-1.5 block">{t.admin.categories.menuItemPriceLabel}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                CHF
              </span>
              <Input
                type="number"
                step="0.05"
                min="0"
                placeholder="0.00"
                value={item.price_chf}
                onChange={(e) => onUpdate(itemIndex, { price_chf: e.target.value })}
                className="h-10 sm:h-11 pl-12 text-right font-mono text-sm font-semibold border-border/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60"
              />
            </div>
          </div>

          {/* Controls - Desktop Only */}
          <div className="hidden sm:flex flex-col items-end gap-3 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <Label className="text-xs text-muted-foreground">{t.admin.categories.menuItemStatusLabel}</Label>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={(checked) => onUpdate(itemIndex, { is_active: checked })}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(itemIndex)}
                className="h-9 w-9 text-muted-foreground dark:text-muted-foreground hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors"
              >
                <Trash2 size={16} />
              </Button>
            </div>
            {!item.is_active && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground"
              >
                {t.admin.categories.menuItemInactive}
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  const isNew = categoryId === "new";
  const { t, language } = useI18n();

  const [categoryTranslations, setCategoryTranslations] = useState<ItemTranslation[]>(
    SUPPORTED_LANGUAGES.map((l) => ({
      language: l.code as Language,
      title: "",
      description: "",
    }))
  );
  const [categoryActive, setCategoryActive] = useState(true);
  const [categoryVisible, setCategoryVisible] = useState(true);
  const [categoryImage, setCategoryImage] = useState<string | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [categoryImageDelete, setCategoryImageDelete] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [slug, setSlug] = useState("");
  const [slugEditable, setSlugEditable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  // Start with default "de" to match server render and avoid hydration mismatch.
  const [langTab, setLangTab] = useState<Language>("de");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("unsaved");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Keep item/category language tab in sync with global UI language
  useEffect(() => {
    setLangTab(language);
  }, [language]);

  // Ensure a completely fresh form when creating a new category
  useEffect(() => {
    if (!isNew) return;

    // Reset all category-level state
    setCategoryTranslations(
      SUPPORTED_LANGUAGES.map((l) => ({
        language: l.code as Language,
        title: "",
        description: "",
      }))
    );
    setCategoryActive(true);
    setCategoryVisible(true);
    setCategoryImage(null);
    setCategoryImageFile(null);
    setCategoryImagePreview(null);
    setCategoryImageDelete(false);
    setDisplayOrder(0);
    setSlug("");
    setSlugEditable(false);
    setItems([]);
    setValidationErrors({});
    setAutoSaveStatus("unsaved");

    // Clear any previous draft cached in localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("category-draft");
      } catch {
        // ignore storage errors
      }
    }
  }, [isNew]);

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

  const loadCategory = useCallback(async () => {
    if (isNew) {
      // For new category, ensure menu exists
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

        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!restaurant) {
          router.push("/admin/onboarding");
          setLoading(false);
          return;
        }

        setRestaurantId(restaurant.id);

        // Ensure menu exists (auto-create if needed)
        const menuId = await ensureMenuExists(restaurant.id);
        if (!menuId) {
          toast.error(t.admin.categories.initError);
          setLoading(false);
          return;
        }

        setMenuId(menuId);
        setLoading(false);
      } catch (err) {
        console.error("Error loading category:", err);
        setLoading(false);
      }
      return;
    }

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

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        router.push("/admin/onboarding");
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);

      // Get category (try with image_url; fallback without if column doesn't exist yet)
      let category: { id: string; menu_id: string; is_active: boolean; image_url?: string | null } | null;
      const resWithImage = await supabase
        .from("categories")
        .select("id, menu_id, is_active, image_url")
        .eq("id", categoryId)
        .single();

      if (resWithImage.error) {
        const resWithoutImage = await supabase
          .from("categories")
          .select("id, menu_id, is_active")
          .eq("id", categoryId)
          .single();
        category = resWithoutImage.data ? { ...resWithoutImage.data, image_url: null } : null;
      } else {
        category = resWithImage.data;
      }

      if (!category) {
        toast.error(t.admin.categories.notFound);
        router.push("/admin/categories");
        return;
      }

      setMenuId(category.menu_id);
      setCategoryActive(category.is_active);
      setCategoryImage(category.image_url ?? null);
      setCategoryImagePreview(category.image_url ?? null);

      // Get category translations
      const { data: translations } = await supabase
        .from("translations")
        .select("entity_id, language, title, description")
        .eq("entity_type", "category")
        .eq("entity_id", categoryId);

      function ensureAllLangs(): ItemTranslation[] {
        const existing = translations?.map((t) => ({
          language: t.language as Language,
          title: t.title,
          description: t.description ?? "",
        })) ?? [];
        return SUPPORTED_LANGUAGES.map((lang) => {
          const found = existing.find((t) => t.language === lang.code);
          return found ?? { language: lang.code as Language, title: "", description: "" };
        });
      }

      setCategoryTranslations(ensureAllLangs());

      // Load items
      const { data: itemsData } = await supabase
        .from("menu_items")
        .select("id, price_chf, sort_order, is_active, image_url")
        .eq("category_id", categoryId)
        .order("sort_order");

      if (!itemsData?.length) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Get item translations
      const itemIds = itemsData.map((i) => i.id);
      const { data: itemTranslations } = await supabase
        .from("translations")
        .select("entity_id, language, title, description")
        .eq("entity_type", "menu_item")
        .in("entity_id", itemIds);

      const itemTrMap = new Map<string, ItemTranslation[]>();
      itemTranslations?.forEach((tr) => {
        if (!itemTrMap.has(tr.entity_id)) itemTrMap.set(tr.entity_id, []);
        itemTrMap.get(tr.entity_id)!.push({
          language: tr.language as Language,
          title: tr.title,
          description: tr.description ?? "",
        });
      });

      function ensureAllItemLangs(entityId: string): ItemTranslation[] {
        const existing = itemTrMap.get(entityId) ?? [];
        return SUPPORTED_LANGUAGES.map((lang) => {
          const found = existing.find((t) => t.language === lang.code);
          return found ?? { language: lang.code as Language, title: "", description: "" };
        });
      }

      setItems(
        itemsData.map((item) => ({
          id: item.id,
          price_chf: item.price_chf.toString(),
          image_url: item.image_url ?? null,
          is_active: item.is_active,
          sort_order: item.sort_order,
          translations: ensureAllItemLangs(item.id),
        }))
      );
    } catch (err) {
      console.error("Error loading category:", err);
      toast.error(t.admin.categories.loadError);
    } finally {
      setLoading(false);
    }
  }, [categoryId, isNew, router, language, ensureMenuExists]);

  useEffect(() => {
    loadCategory();
  }, [loadCategory]);

  function addItem() {
    const newItem: EditableItem = {
      id: `new-item-${Date.now()}`,
      price_chf: "",
      image_url: null,
      is_active: true,
      sort_order: items.length,
      translations: SUPPORTED_LANGUAGES.map((l) => ({
        language: l.code as Language,
        title: "",
        description: "",
      })),
      isNew: true,
    };
    setItems([...items, newItem]);
  }

  function updateItem(itemIdx: number, updates: Partial<EditableItem>) {
    setItems(items.map((item, i) => (i === itemIdx ? { ...item, ...updates } : item)));
  }

  function removeItem(itemIdx: number) {
    setItems(items.filter((_, i) => i !== itemIdx));
  }

  // Helper function to validate fields
  function validateField(field: string, value: string) {
    const errors = { ...validationErrors };
    if (field === "title") {
      if (!value.trim()) {
        errors.title = t.admin.categories.validationNameRequired;
      } else if (value.length < 3) {
        errors.title = t.admin.categories.validationNameTooShort;
      } else {
        delete errors.title;
      }
    }
    setValidationErrors(errors);
  }

  // Handle image upload
  function handleImageUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    // No file size limit - allow any size
    setCategoryImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCategoryImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Auto-save draft functionality
  useEffect(() => {
    if (!isNew || loading) return;
    
    const autoSaveTimer = setTimeout(() => {
      const hasChanges = categoryTranslations.some((t) => t.title || t.description) || categoryImageFile;
      if (hasChanges) {
        setAutoSaveStatus("saving");
        try {
          // Save to localStorage as draft (exclude image preview to avoid quota issues)
          const draft = {
            translations: categoryTranslations,
            active: categoryActive,
            visible: categoryVisible,
            displayOrder,
            slug,
            // Note: imagePreview excluded - base64 images are too large for localStorage
            // The image file itself is stored in categoryImageFile state
          };
          localStorage.setItem("category-draft", JSON.stringify(draft));
          setTimeout(() => setAutoSaveStatus("saved"), 500);
        } catch (error: any) {
          // Handle localStorage quota exceeded or other errors
          if (error.name === "QuotaExceededError") {
            console.warn("localStorage quota exceeded, skipping auto-save");
            setAutoSaveStatus("unsaved");
          } else {
            console.error("Auto-save error:", error);
            setAutoSaveStatus("unsaved");
          }
        }
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [categoryTranslations, categoryActive, categoryVisible, displayOrder, slug, categoryImageFile, isNew, loading]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);

    setItems(
      arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        sort_order: idx,
      }))
    );
  }

  async function handleSave() {
    if (isNew && !menuId) {
      // Need to get menu first (or create it)
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        toast.error("Please set up your restaurant first.");
        router.push("/admin/onboarding");
        return;
      }

      setRestaurantId(restaurant.id);

      // Ensure menu exists (auto-create if needed)
      const menuId = await ensureMenuExists(restaurant.id);
      if (!menuId) {
      toast.error(t.admin.categories.initError);
        return;
      }

      setMenuId(menuId);
    }

    if (!menuId) {
      toast.error("Menu not found");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!restaurant) {
        toast.error("Please set up your restaurant first.");
        router.push("/admin/onboarding");
        return;
      }

      let currentCategoryId = categoryId;

      // Create or update category (create first so we have categoryId for image upload)
      if (isNew) {
        const { data: newCat, error: catError } = await supabase
          .from("categories")
          .insert({
            menu_id: menuId,
            sort_order: 0,
            is_active: categoryActive,
            image_url: null,
          })
          .select("id")
          .single();

        if (catError || !newCat) throw catError;
        currentCategoryId = newCat.id;
      }

      // Handle category image: upload, delete, or keep
      let categoryImageUrl: string | null = isNew ? null : categoryImage;
      if (categoryImageDelete && !categoryImageFile) {
        await deleteCategoryImage(restaurant.id, currentCategoryId);
        categoryImageUrl = null;
      } else if (categoryImageFile) {
        try {
          const result = await uploadCategoryImage(
            restaurant.id,
            currentCategoryId,
            categoryImageFile
          );
          categoryImageUrl = result.url;
        } catch (uploadErr) {
          console.error("Category image upload failed:", uploadErr);
          toast.error(t.admin.categories.imageUploadError);
          setSaving(false);
          return;
        }
      }

      // Update category with image_url (for both new and edit)
      await supabase
        .from("categories")
        .update({
          is_active: categoryActive,
          image_url: categoryImageUrl,
        })
        .eq("id", currentCategoryId);

      // Save category translations
      for (const tr of categoryTranslations) {
        if (!tr.title) continue;
        await supabase.from("translations").upsert(
          {
            entity_type: "category" as const,
            entity_id: currentCategoryId,
            language: tr.language,
            title: tr.title,
            description: tr.description || null,
          },
          { onConflict: "entity_type,entity_id,language" }
        );
      }

      // Save items
      for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
        const item = items[itemIdx];
        let itemId = item.id;
        let imageUrl = item.image_url;

        if (item.isNew) {
          const { data: newItem, error } = await supabase
            .from("menu_items")
            .insert({
              category_id: currentCategoryId,
              price_chf: parseFloat(item.price_chf) || 0,
              sort_order: itemIdx,
              is_active: item.is_active,
              image_url: null,
            })
            .select("id")
            .single();

          if (error || !newItem) throw error;
          itemId = newItem.id;
        }

        if (item._deleteImage && !item._pendingFile) {
          await deleteItemImage(restaurant.id, itemId);
          imageUrl = null;
        }

        if (item._pendingFile) {
          try {
            const result = await uploadItemImage(restaurant.id, itemId, item._pendingFile);
            imageUrl = result.url;
          } catch (uploadErr) {
            console.error("Image upload failed:", uploadErr);
            toast.error(`Image upload failed for item: ${item.translations[0]?.title || "unknown"}`);
          }
        }

        if (!item.isNew) {
          await supabase
            .from("menu_items")
            .update({
              price_chf: parseFloat(item.price_chf) || 0,
              sort_order: itemIdx,
              is_active: item.is_active,
              image_url: imageUrl,
            })
            .eq("id", itemId);
        } else if (imageUrl) {
          await supabase.from("menu_items").update({ image_url: imageUrl }).eq("id", itemId);
        }

        // Save item translations
        for (const tr of item.translations) {
          if (!tr.title) continue;
          await supabase.from("translations").upsert(
            {
              entity_type: "menu_item" as const,
              entity_id: itemId,
              language: tr.language,
              title: tr.title,
              description: tr.description || null,
            },
            { onConflict: "entity_type,entity_id,language" }
          );
        }
      }

      // Get restaurant slug for revalidation
      const { data: restaurantForRevalidate } = await supabase
        .from("restaurants")
        .select("slug")
        .eq("id", restaurant.id)
        .single();

      if (restaurantForRevalidate?.slug) {
        await fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menuId, restaurantSlug: restaurantForRevalidate.slug }),
        }).catch(() => {});
      }

      toast.success(
        isNew ? t.admin.categories.createdSuccess : t.admin.categories.savedSuccess
      );
      router.push("/admin/categories");
    } catch (err) {
      console.error(err);
      toast.error(t.admin.categories.saveError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Breadcrumbs */}
      <FadeIn>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/categories">{t.admin.categories.title}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">
                {isNew
                  ? t.admin.categories.newCategory
                  : categoryTranslations.find((t) => t.language === language)?.title ||
                    categoryTranslations.find((t) => t.title)?.title ||
                    t.admin.categories.title}
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </FadeIn>

      {/* Modern Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-4">
          <Link href="/admin/categories">
            <motion.div
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl border border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:hover:bg-[#2D3A1A]/50"
              >
                <ArrowLeft size={18} className="text-[#2D3A1A] dark:text-[#E8E4D9]" />
              </Button>
            </motion.div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-[#5B7A2F]/20 to-[#5B7A2F]/10 p-2.5 dark:from-[#7A9E4A]/20 dark:to-[#7A9E4A]/10">
              <Plus className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2D3A1A] dark:text-[#E8E4D9]">
                {isNew ? "Add New Category" : t.admin.categories.editCategory}
              </h1>
              <p className="text-sm text-[#6B7B5A] dark:text-[#9CA88A] mt-0.5">
                {isNew ? "Create and organize categories for your menu" : t.admin.categories.editCategorySubtitle}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {autoSaveStatus === "saving" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-[#6B7B5A] dark:text-[#9CA88A]"
            >
              <Loader2 className="h-4 w-4 animate-spin text-[#5B7A2F] dark:text-[#7A9E4A]" />
              <span className="hidden sm:inline">{t.admin.categories.saving}</span>
            </motion.div>
          )}
          {autoSaveStatus === "saved" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-[#5B7A2F] dark:text-[#7A9E4A]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t.admin.categories.draftSaved}</span>
            </motion.div>
          )}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg hover:shadow-xl transition-all hover:from-[#16A34A] hover:to-[#15803D] disabled:opacity-50 px-6"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span>{isNew ? "Add Category" : t.admin.categories.saveCategory}</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>


      {/* Language Tabs & Category/Items */}
      <FadeIn delay={0.15}>
        <Tabs value={langTab} onValueChange={(v) => setLangTab(v as Language)}>
          <TabsList>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TabsTrigger key={lang.code} value={lang.code} className="gap-1.5">
                <span>{lang.flag}</span>
                <span className="hidden sm:inline">{lang.label}</span>
                <span className="sm:hidden">{lang.code.toUpperCase()}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {SUPPORTED_LANGUAGES.map((lang) => {
            const catTr = categoryTranslations.find((t) => t.language === lang.code);
            return (
              <TabsContent key={lang.code} value={lang.code}>
                <div className="space-y-6 pt-2">
                  {/* Modern Centered Form Card */}
                  <div className="max-w-5xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      {/* Category Details Card */}
                      <Card className="rounded-3xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-xl dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl font-bold text-[#2D3A1A] dark:text-[#E8E4D9] flex items-center gap-2">
                            <div className="rounded-xl bg-gradient-to-br from-[#5B7A2F]/20 to-[#5B7A2F]/10 p-2 dark:from-[#7A9E4A]/20 dark:to-[#7A9E4A]/10">
                              <Edit2 className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                            </div>
                            {t.admin.categories.detailsTitle}
                          </CardTitle>
                          <p className="text-sm text-[#6B7B5A] dark:text-[#9CA88A] mt-1">
                            {t.admin.categories.detailsSubtitle}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Category Name */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                                  {t.admin.categories.nameLabel}
                                </Label>
                                <span className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                                  {catTr?.title?.length || 0}/50
                                </span>
                              </div>
                              <div className="relative">
                                <Input
                                  value={catTr?.title ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value.slice(0, 50);
                                    const updated = categoryTranslations.map((t) =>
                                      t.language === lang.code
                                        ? { ...t, title: value }
                                        : t
                                    );
                                    setCategoryTranslations(updated);
                                    // Auto-generate slug
                                    if (isNew && !slugEditable) {
                                      const newSlug = value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9]+/g, "-")
                                        .replace(/^-+|-+$/g, "");
                                      setSlug(newSlug);
                                    }
                                    // Validate
                                    validateField("title", value);
                                  }}
                                  placeholder={t.admin.categories.namePlaceholder}
                                  className={`h-12 rounded-xl border-2 pr-10 text-sm transition-all ${
                                    validationErrors.title
                                      ? "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                                      : "border-[#D6D2C4]/50 focus-visible:border-[#5B7A2F] focus-visible:ring-[#5B7A2F]/20 dark:border-[#3D4F2A]/50 dark:focus-visible:border-[#7A9E4A]"
                                  } bg-white/50 dark:bg-[#243019]/50`}
                                  maxLength={50}
                                />
                                {catTr?.title && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                  >
                                    {validationErrors.title ? (
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                                    )}
                                  </motion.div>
                                )}
                              </div>
                              {validationErrors.title && (
                                <motion.p
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {validationErrors.title}
                                </motion.p>
                              )}
                            </motion.div>

                            {/* Auto-generated Slug */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Label className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                                  {t.admin.categories.urlSlugLabel}
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSlugEditable(!slugEditable)}
                                  className="h-8 px-3 text-xs rounded-xl border-[#D6D2C4]/50 bg-white/50 hover:bg-[#E8E4D9]/50 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:hover:bg-[#2D3A1A]/50"
                                >
                                  {slugEditable ? (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" />
                                      {t.admin.categories.save}
                                    </>
                                  ) : (
                                    <>
                                      <Edit2 className="h-3 w-3 mr-1" />
                                      {t.admin.categories.edit}
                                    </>
                                  )}
                                </Button>
                              </div>
                              <Input
                                value={slug}
                                onChange={(e) => {
                                  const value = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, "-")
                                    .replace(/-+/g, "-")
                                    .replace(/^-+|-+$/g, "");
                                  setSlug(value);
                                }}
                                placeholder={t.admin.categories.urlSlugPlaceholder}
                                disabled={!slugEditable}
                                className="h-11 font-mono text-sm rounded-xl border-2 border-[#D6D2C4]/50 bg-white/50 focus-visible:border-[#5B7A2F] focus-visible:ring-[#5B7A2F]/20 dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:focus-visible:border-[#7A9E4A]"
                              />
                              <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                                {t.admin.categories.urlSlugHelper}
                              </p>
                            </motion.div>

                            {/* Description with Character Limit */}
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                                  {t.admin.categories.descriptionLabel}
                                </Label>
                                <span className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                                  {catTr?.description?.length || 0}/200
                                </span>
                              </div>
                              <Textarea
                                value={catTr?.description ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value.slice(0, 200);
                                  const updated = categoryTranslations.map((t) =>
                                    t.language === lang.code
                                      ? { ...t, description: value }
                                      : t
                                  );
                                  setCategoryTranslations(updated);
                                }}
                                placeholder={t.admin.categories.descriptionPlaceholder}
                                className="min-h-[120px] resize-none rounded-xl border-2 border-[#D6D2C4]/50 bg-white/50 focus-visible:border-[#5B7A2F] focus-visible:ring-[#5B7A2F]/20 transition-all dark:border-[#3D4F2A]/50 dark:bg-[#243019]/50 dark:focus-visible:border-[#7A9E4A]"
                                maxLength={200}
                              />
                            </motion.div>
                          </CardContent>
                        </Card>

                      {/* Modern Image Upload Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                      >
                        <Card className="rounded-3xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-xl dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold text-[#2D3A1A] dark:text-[#E8E4D9] flex items-center gap-2">
                              <div className="rounded-xl bg-gradient-to-br from-[#5B7A2F]/20 to-[#5B7A2F]/10 p-2 dark:from-[#7A9E4A]/20 dark:to-[#7A9E4A]/10">
                                <ImageIcon className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                              </div>
                              {t.admin.categories.imageTitle}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <motion.div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                              }}
                              onDragLeave={() => setIsDragging(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                const file = e.dataTransfer.files[0];
                                if (file && file.type.startsWith("image/")) {
                                  handleImageUpload(file);
                                }
                              }}
                              whileHover={{ scale: 1.01 }}
                              className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
                                isDragging
                                  ? "border-[#22C55E] bg-[#DCFCE7]/50 dark:bg-[#7A9E4A]/10"
                                  : "border-[#D6D2C4]/50 hover:border-[#5B7A2F]/50 hover:bg-[#DCFCE7]/20 dark:border-[#3D4F2A]/50 dark:hover:border-[#7A9E4A]/50 dark:hover:bg-[#7A9E4A]/10"
                              }`}
                            >
                              {categoryImagePreview ? (
                                <div className="relative">
                                  <motion.img
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    src={categoryImagePreview}
                                    alt="Category preview"
                                    className="w-full h-64 object-cover rounded-xl shadow-lg"
                                  />
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-3 right-3 rounded-full shadow-lg"
                                      onClick={() => {
                                        setCategoryImagePreview(null);
                                        setCategoryImageFile(null);
                                        if (categoryImage) setCategoryImageDelete(true);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring" }}
                                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#DCFCE7] to-[#BBF7D0] dark:from-[#7A9E4A]/20 dark:to-[#7A9E4A]/10"
                                  >
                                    <Upload className="h-8 w-8 text-[#22C55E] dark:text-[#7A9E4A]" />
                                  </motion.div>
                                  <p className="text-base font-semibold mb-2 text-[#2D3A1A] dark:text-[#E8E4D9]">
                                    Upload category image
                                  </p>
                                  <p className="text-sm text-[#6B7B5A] dark:text-[#9CA88A] mb-6">
                                    Drag and drop an image here, or click to browse
                                  </p>
                                  <label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(file);
                                      }}
                                    />
                                    <motion.div
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Button
                                        type="button"
                                        className="rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white shadow-lg hover:shadow-xl hover:from-[#16A34A] hover:to-[#15803D] px-6"
                                      >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {t.admin.categories.uploadImageButton}
                                      </Button>
                                    </motion.div>
                                  </label>
                                </div>
                              )}
                            </motion.div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Menu Items Section */}
                  <FadeIn delay={0.3}>
                    <div className="max-w-5xl mx-auto">
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{t.admin.categories.menuItemsTitle}</CardTitle>
                          <span className="text-sm text-muted-foreground">
                            {items.length} {items.length === 1 ? t.admin.categories.menuItemsItem : t.admin.categories.menuItemsItems}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {items.length > 0 ? (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={items.map((i) => i.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-3">
                                <AnimatePresence>
                                  {items.map((item, itemIdx) => (
                                    <SortableItem
                                      key={item.id}
                                      item={item}
                                      itemIndex={itemIdx}
                                      onUpdate={updateItem}
                                      onRemove={removeItem}
                                      langTab={langTab}
                                      saving={saving}
                                      t={t}
                                    />
                                  ))}
                                </AnimatePresence>
                              </div>
                            </SortableContext>
                          </DndContext>
                        ) : (
                          <div className="py-12 text-center border-2 border-dashed border-border/50 rounded-lg">
                            <div className="space-y-3">
                              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Plus className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {t.admin.categories.menuItemsEmptyTitle}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {t.admin.categories.menuItemsEmptyDescription}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            onClick={addItem}
                            className="gap-2 border-dashed border-2 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all w-full sm:w-auto"
                            size="lg"
                          >
                            <Plus size={18} />
                            <span className="font-medium">{t.admin.categories.menuItemsAddButton}</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  </FadeIn>

                  {/* Settings Card - placed below Menu Items */}
                  <div className="max-w-5xl mx-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <Card className="mt-4 rounded-3xl border border-[#D6D2C4]/50 bg-gradient-to-br from-[#FAFAF5] to-[#F0EDE4]/50 shadow-xl dark:border-[#3D4F2A]/50 dark:from-[#1A2212] dark:to-[#243019]/50">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl font-bold text-[#2D3A1A] dark:text-[#E8E4D9] flex items-center gap-2">
                            <div className="rounded-xl bg-gradient-to-br from-[#5B7A2F]/20 to-[#5B7A2F]/10 p-2 dark:from-[#7A9E4A]/20 dark:to-[#7A9E4A]/10">
                              <CheckCircle2 className="h-5 w-5 text-[#5B7A2F] dark:text-[#7A9E4A]" />
                            </div>
                            {t.admin.categories.settingsTitle}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-[#243019]/50 border border-[#D6D2C4]/30 dark:border-[#3D4F2A]/30">
                            <div className="space-y-1">
                              <Label className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                                {t.admin.categories.statusLabel}
                              </Label>
                              <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                                {categoryActive
                                  ? t.admin.categories.statusActiveHint
                                  : t.admin.categories.statusInactiveHint}
                              </p>
                            </div>
                            <Switch
                              checked={categoryActive}
                              onCheckedChange={setCategoryActive}
                              className="data-[state=checked]:bg-[#22C55E]"
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-[#243019]/50 border border-[#D6D2C4]/30 dark:border-[#3D4F2A]/30">
                            <div className="space-y-1">
                              <Label className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                                {t.admin.categories.visibilityLabel}
                              </Label>
                              <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                                {categoryVisible
                                  ? t.admin.categories.visibilityPublic
                                  : t.admin.categories.visibilityPrivate}
                              </p>
                            </div>
                            <Switch
                              checked={categoryVisible}
                              onCheckedChange={setCategoryVisible}
                              className="data-[state=checked]:bg-[#22C55E]"
                            />
                          </div>
                          <div className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-[#243019]/50 border border-[#D6D2C4]/30 dark:border-[#3D4F2A]/30">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold text-[#2D3A1A] dark:text-[#E8E4D9]">
                                {t.admin.categories.displayOrderLabel}
                              </Label>
                              <span className="text-sm font-mono font-bold text-[#5B7A2F] dark:text-[#7A9E4A] bg-[#DCFCE7]/50 dark:bg-[#7A9E4A]/10 px-3 py-1 rounded-lg">
                                {displayOrder}
                              </span>
                            </div>
                            <Slider
                              value={[displayOrder]}
                              onValueChange={([value]) => setDisplayOrder(value)}
                              min={0}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                            <p className="text-xs text-[#6B7B5A] dark:text-[#9CA88A]">
                              {t.admin.categories.displayOrderHint}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </FadeIn>
    </motion.div>
  );
}

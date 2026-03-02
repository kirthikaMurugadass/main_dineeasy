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
    <div className="space-y-6">
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

      {/* Header */}
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/50 bg-card/80 px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-4 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <Link href="/admin/categories">
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 rounded-full border border-border/60">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div className="min-w-0 space-y-1">
              <PageTitle className="truncate">
                {isNew
                  ? t.admin.categories.newCategory
                  : categoryTranslations.find((t) => t.language === language)?.title ||
                    categoryTranslations.find((t) => t.title)?.title ||
                    t.admin.categories.editCategory}
              </PageTitle>
              <p className="text-xs text-muted-foreground">
                {isNew
                  ? t.admin.categories.newCategorySubtitle
                  : t.admin.categories.editCategorySubtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            {autoSaveStatus === "saving" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground"
              >
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                <span className="hidden sm:inline">{t.admin.categories.saving}</span>
              </motion.div>
            )}
            {autoSaveStatus === "saved" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-emerald-500"
              >
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t.admin.categories.draftSaved}</span>
                <span className="sm:hidden">{t.admin.categories.save}</span>
              </motion.div>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-shrink-0 gap-1.5 px-3 text-xs sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
              size="sm"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin sm:w-4 sm:h-4" />
              ) : (
                <Save size={14} className="sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline">{t.admin.categories.saveCategory}</span>
              <span className="sm:hidden">{t.admin.categories.save}</span>
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Category Settings */}
      <FadeIn delay={0.1}>
        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:p-6">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {t.admin.categories.statusTitle}
              </h2>
              <p className="text-xs text-muted-foreground max-w-md">
                {t.admin.categories.statusDescription}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
              <Switch checked={categoryActive} onCheckedChange={setCategoryActive} />
              <Label className="text-sm">
                {categoryActive ? t.admin.categories.active : t.admin.categories.inactive}
              </Label>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

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
                  {/* Modern Two-Column Category Form */}
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    {/* Left Column: Main Form */}
                    <div className="space-y-6">
                      {/* Category Details Card */}
                      <FadeIn delay={0.1}>
                        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-sm">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold tracking-tight">
                              {t.admin.categories.detailsTitle}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {t.admin.categories.detailsSubtitle}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            {/* Category Name */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                  {t.admin.categories.nameLabel}
                                </Label>
                                <span className="text-xs text-muted-foreground">
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
                                  className={`h-11 pr-10 text-sm ${
                                    validationErrors.title
                                      ? "border-destructive focus-visible:ring-destructive"
                                      : ""
                                  }`}
                                  maxLength={50}
                                />
                                {catTr?.title && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                  >
                                    {validationErrors.title ? (
                                      <AlertCircle className="h-4 w-4 text-destructive" />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                  </motion.div>
                                )}
                              </div>
                              {validationErrors.title && (
                                <motion.p
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs text-destructive flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {validationErrors.title}
                                </motion.p>
                              )}
                            </div>

                            {/* Auto-generated Slug */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <Label className="text-sm font-medium">
                                  {t.admin.categories.urlSlugLabel}
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSlugEditable(!slugEditable)}
                                  className="h-7 px-2 text-[11px]"
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
                                className="h-10 font-mono text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                {t.admin.categories.urlSlugHelper}
                              </p>
                            </div>

                            {/* Description with Character Limit */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                  {t.admin.categories.descriptionLabel}
                                </Label>
                                <span className="text-xs text-muted-foreground">
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
                                className="min-h-[100px] resize-none"
                                maxLength={200}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </FadeIn>

                      {/* Media Upload Card */}
                      <FadeIn delay={0.15}>
                        <Card className="border-border/50 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {t.admin.categories.imageTitle}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div
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
                              className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
                                isDragging
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              {categoryImagePreview ? (
                                <div className="relative">
                                  <motion.img
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    src={categoryImagePreview}
                                    alt="Category preview"
                                    className="w-full h-48 object-cover rounded-lg"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                      setCategoryImagePreview(null);
                                      setCategoryImageFile(null);
                                      if (categoryImage) setCategoryImageDelete(true);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                  <p className="text-sm font-medium mb-2">
                                    {t.admin.categories.imageUploadCta}
                                  </p>
                                  <p className="text-xs text-muted-foreground mb-4">
                                    {t.admin.categories.imageUploadHint}
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
                                    <Button variant="outline" type="button" asChild>
                                      <span>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {t.admin.categories.uploadImageButton}
                                      </span>
                                    </Button>
                                  </label>
                                  <p className="text-xs text-muted-foreground mt-3">
                                    {t.admin.categories.imageUploadHint}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </FadeIn>

                      {/* Settings Card */}
                      <FadeIn delay={0.2}>
                      <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">{t.admin.categories.settingsTitle}</CardTitle>
                        </CardHeader>
                          <CardContent className="space-y-5">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-sm font-medium">
                                  {t.admin.categories.statusLabel}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {categoryActive
                                    ? t.admin.categories.statusActiveHint
                                    : t.admin.categories.statusInactiveHint}
                                </p>
                              </div>
                              <Switch
                                checked={categoryActive}
                                onCheckedChange={setCategoryActive}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label className="text-sm font-medium">
                                  {t.admin.categories.visibilityLabel}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {categoryVisible
                                    ? t.admin.categories.visibilityPublic
                                    : t.admin.categories.visibilityPrivate}
                                </p>
                              </div>
                              <Switch
                                checked={categoryVisible}
                                onCheckedChange={setCategoryVisible}
                              />
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">
                                  {t.admin.categories.displayOrderLabel}
                                </Label>
                                <span className="text-sm font-mono text-muted-foreground">
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
                              <p className="text-xs text-muted-foreground">
                                {t.admin.categories.displayOrderHint}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </FadeIn>
                    </div>

                    {/* Right Column: Smart UX Panel */}
                    <div className="space-y-6">
                      {/* Live Preview Card */}
                      <FadeIn delay={0.25}>
                        <Card className="border-border/50 shadow-sm sticky top-6">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Eye className="h-5 w-5 text-primary" />
                              {t.admin.categories.livePreviewTitle}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {loading ? (
                                <div className="space-y-3">
                                  <div className="h-32 animate-pulse rounded-lg bg-muted" />
                                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                                </div>
                              ) : (
                                <motion.div
                                  key={`${catTr?.title}-${categoryImagePreview}`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="space-y-3"
                                >
                                  {categoryImagePreview && (
                                    <img
                                      src={categoryImagePreview}
                                      alt="Preview"
                                      className="w-full h-32 object-cover rounded-lg"
                                    />
                                  )}
                                  <h3 className="font-semibold text-lg">
                                    {catTr?.title || t.admin.categories.livePreviewFallbackName}
                                  </h3>
                                  {catTr?.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {catTr.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs">
                                    <span
                                      className={`px-2 py-1 rounded ${
                                        categoryActive
                                          ? "bg-green-500/10 text-green-600"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {categoryActive ? t.admin.categories.previewActive : t.admin.categories.previewInactive}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {t.admin.categories.previewOrder}: {displayOrder}
                                    </span>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </FadeIn>

                      {/* Smart Tips Panel */}
                      <FadeIn delay={0.3}>
                        <Card className="border-border/50 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Lightbulb className="h-5 w-5 text-primary" />
                              {t.admin.categories.tipsTitle}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-3">
                              <div className="flex gap-3">
                                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {t.admin.categories.tipsNamingTitle}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {t.admin.categories.tipsNamingBody}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {t.admin.categories.tipsSeoTitle}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {t.admin.categories.tipsSeoBody}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <ImageIcon className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {t.admin.categories.tipsImageTitle}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {t.admin.categories.tipsImageBody}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </FadeIn>
                    </div>
                  </div>

                  {/* Menu Items Section */}
                  <FadeIn delay={0.3}>
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
                  </FadeIn>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </FadeIn>
    </div>
  );
}

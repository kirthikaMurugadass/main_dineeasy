"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  ArrowLeft,
  Loader2,
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
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/dictionaries";
import { toast } from "sonner";
import type { Language } from "@/types/database";
import { ItemImageUpload } from "@/components/admin/item-image-upload";
import { uploadItemImage, deleteItemImage } from "@/lib/upload";
import Link from "next/link";

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
  /** Staged file waiting to be uploaded on save */
  _pendingFile?: File;
  /** Flag to delete the current image on save */
  _deleteImage?: boolean;
}

interface EditableCategory {
  id: string;
  is_active: boolean;
  sort_order: number;
  translations: ItemTranslation[];
  items: EditableItem[];
  expanded: boolean;
  isNew?: boolean;
}

function SortableItem({
  item,
  categoryIndex,
  itemIndex,
  onUpdate,
  onRemove,
  langTab,
  saving,
}: {
  item: EditableItem;
  categoryIndex: number;
  itemIndex: number;
  onUpdate: (catIdx: number, itemIdx: number, updates: Partial<EditableItem>) => void;
  onRemove: (catIdx: number, itemIdx: number) => void;
  langTab: Language;
  saving: boolean;
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
    onUpdate(categoryIndex, itemIndex, { translations: updated });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-lg border border-border/30 bg-background p-3 transition-colors hover:border-border"
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-2 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>

      {/* Item image */}
      <ItemImageUpload
        imageUrl={item.image_url}
        uploading={saving && !!item._pendingFile}
        disabled={saving}
        onFileSelected={(file) =>
          onUpdate(categoryIndex, itemIndex, {
            _pendingFile: file,
            _deleteImage: false,
          })
        }
        onRemove={() =>
          onUpdate(categoryIndex, itemIndex, {
            image_url: null,
            _pendingFile: undefined,
            _deleteImage: true,
          })
        }
      />

      <div className="flex-1 space-y-2">
        <Input
          placeholder="Item name"
          value={tr?.title ?? ""}
          onChange={(e) => updateTranslation("title", e.target.value)}
          className="h-9 text-sm font-medium"
        />
        <Input
          placeholder="Description (optional)"
          value={tr?.description ?? ""}
          onChange={(e) => updateTranslation("description", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <div className="w-28">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            CHF
          </span>
          <Input
            type="number"
            step="0.05"
            min="0"
            placeholder="0.00"
            value={item.price_chf}
            onChange={(e) =>
              onUpdate(categoryIndex, itemIndex, { price_chf: e.target.value })
            }
            className="h-9 pl-10 text-right font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Switch
          checked={item.is_active}
          onCheckedChange={(checked) =>
            onUpdate(categoryIndex, itemIndex, { is_active: checked })
          }
          className="scale-75"
        />
        <button
          onClick={() => onRemove(categoryIndex, itemIndex)}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function MenuEditorPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = params.id as string;
  const isNew = menuId === "new";
  const { t } = useI18n();

  const [menuSlug, setMenuSlug] = useState("");
  const [menuActive, setMenuActive] = useState(true);
  const [categories, setCategories] = useState<EditableCategory[]>([]);
  const [langTab, setLangTab] = useState<Language>("en");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load existing menu data
  useEffect(() => {
    if (isNew) return;

    async function load() {
      const supabase = createClient();

      const { data: menu } = await supabase
        .from("menus")
        .select("slug, is_active")
        .eq("id", menuId)
        .single();

      if (!menu) {
        router.push("/admin/menus");
        return;
      }

      setMenuSlug(menu.slug);
      setMenuActive(menu.is_active);

      const { data: cats } = await supabase
        .from("categories")
        .select("id, sort_order, is_active")
        .eq("menu_id", menuId)
        .order("sort_order");

      if (!cats?.length) {
        setLoading(false);
        return;
      }

      const catIds = cats.map((c) => c.id);

      const { data: items } = await supabase
        .from("menu_items")
        .select("id, category_id, price_chf, sort_order, is_active, image_url")
        .in("category_id", catIds)
        .order("sort_order");

      const entityIds = [...catIds, ...(items?.map((i) => i.id) ?? [])];
      const { data: translations } = await supabase
        .from("translations")
        .select("entity_id, language, title, description")
        .in("entity_id", entityIds);

      const trMap = new Map<string, ItemTranslation[]>();
      translations?.forEach((tr) => {
        if (!trMap.has(tr.entity_id)) trMap.set(tr.entity_id, []);
        trMap.get(tr.entity_id)!.push({
          language: tr.language as Language,
          title: tr.title,
          description: tr.description ?? "",
        });
      });

      function ensureAllLangs(entityId: string): ItemTranslation[] {
        const existing = trMap.get(entityId) ?? [];
        return SUPPORTED_LANGUAGES.map((lang) => {
          const found = existing.find((t) => t.language === lang.code);
          return found ?? { language: lang.code as Language, title: "", description: "" };
        });
      }

      setCategories(
        cats.map((cat) => ({
          id: cat.id,
          is_active: cat.is_active,
          sort_order: cat.sort_order,
          translations: ensureAllLangs(cat.id),
          expanded: true,
          items: (items ?? [])
            .filter((i) => i.category_id === cat.id)
            .map((item) => ({
              id: item.id,
              price_chf: item.price_chf.toString(),
              image_url: item.image_url ?? null,
              is_active: item.is_active,
              sort_order: item.sort_order,
              translations: ensureAllLangs(item.id),
            })),
        }))
      );
      setLoading(false);
    }

    load();
  }, [menuId, isNew, router]);

  function addCategory() {
    const newCat: EditableCategory = {
      id: `new-cat-${Date.now()}`,
      is_active: true,
      sort_order: categories.length,
      translations: SUPPORTED_LANGUAGES.map((l) => ({
        language: l.code as Language,
        title: "",
        description: "",
      })),
      items: [],
      expanded: true,
      isNew: true,
    };
    setCategories([...categories, newCat]);
  }

  function removeCategory(index: number) {
    setCategories(categories.filter((_, i) => i !== index));
  }

  function updateCategory(index: number, updates: Partial<EditableCategory>) {
    setCategories(categories.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  }

  function updateCategoryTranslation(catIdx: number, field: "title" | "description", value: string) {
    const cat = categories[catIdx];
    const updated = cat.translations.map((t) =>
      t.language === langTab ? { ...t, [field]: value } : t
    );
    updateCategory(catIdx, { translations: updated });
  }

  function addItem(catIdx: number) {
    const cat = categories[catIdx];
    const newItem: EditableItem = {
      id: `new-item-${Date.now()}`,
      price_chf: "",
      image_url: null,
      is_active: true,
      sort_order: cat.items.length,
      translations: SUPPORTED_LANGUAGES.map((l) => ({
        language: l.code as Language,
        title: "",
        description: "",
      })),
      isNew: true,
    };
    updateCategory(catIdx, { items: [...cat.items, newItem] });
  }

  function updateItem(catIdx: number, itemIdx: number, updates: Partial<EditableItem>) {
    const cat = categories[catIdx];
    const items = cat.items.map((item, i) =>
      i === itemIdx ? { ...item, ...updates } : item
    );
    updateCategory(catIdx, { items });
  }

  function removeItem(catIdx: number, itemIdx: number) {
    const cat = categories[catIdx];
    updateCategory(catIdx, {
      items: cat.items.filter((_, i) => i !== itemIdx),
    });
  }

  function handleDragEnd(catIdx: number) {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const cat = categories[catIdx];
      const oldIndex = cat.items.findIndex((i) => i.id === active.id);
      const newIndex = cat.items.findIndex((i) => i.id === over.id);

      updateCategory(catIdx, {
        items: arrayMove(cat.items, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          sort_order: idx,
        })),
      });
    };
  }

  async function handleSave() {
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

      let currentMenuId = menuId;

      if (isNew) {
        const slug = menuSlug || `menu-${Date.now()}`;
        const { data: newMenu, error } = await supabase
          .from("menus")
          .insert({
            restaurant_id: restaurant.id,
            slug,
            is_active: menuActive,
          })
          .select("id")
          .single();

        if (error || !newMenu) throw error;
        currentMenuId = newMenu.id;
      } else {
        await supabase
          .from("menus")
          .update({ slug: menuSlug, is_active: menuActive })
          .eq("id", currentMenuId);
      }

      // Save categories and items
      for (let catIdx = 0; catIdx < categories.length; catIdx++) {
        const cat = categories[catIdx];
        let catId = cat.id;

        if (cat.isNew) {
          const { data: newCat, error } = await supabase
            .from("categories")
            .insert({
              menu_id: currentMenuId,
              sort_order: catIdx,
              is_active: cat.is_active,
            })
            .select("id")
            .single();

          if (error || !newCat) throw error;
          catId = newCat.id;
        } else {
          await supabase
            .from("categories")
            .update({ sort_order: catIdx, is_active: cat.is_active })
            .eq("id", catId);
        }

        // Save category translations
        for (const tr of cat.translations) {
          if (!tr.title) continue;
          await supabase.from("translations").upsert(
            {
              entity_type: "category" as const,
              entity_id: catId,
              language: tr.language,
              title: tr.title,
              description: tr.description || null,
            },
            { onConflict: "entity_type,entity_id,language" }
          );
        }

        // Save items
        for (let itemIdx = 0; itemIdx < cat.items.length; itemIdx++) {
          const item = cat.items[itemIdx];
          let itemId = item.id;
          let imageUrl = item.image_url;

          if (item.isNew) {
            const { data: newItem, error } = await supabase
              .from("menu_items")
              .insert({
                category_id: catId,
                price_chf: parseFloat(item.price_chf) || 0,
                sort_order: itemIdx,
                is_active: item.is_active,
                image_url: null, // set after upload
              })
              .select("id")
              .single();

            if (error || !newItem) throw error;
            itemId = newItem.id;
          }

          // Handle image upload / delete
          if (item._deleteImage && !item._pendingFile) {
            // User wants to remove the image
            await deleteItemImage(restaurant.id, itemId);
            imageUrl = null;
          }

          if (item._pendingFile) {
            // Upload new image (replaces any existing)
            try {
              const result = await uploadItemImage(
                restaurant.id,
                itemId,
                item._pendingFile
              );
              imageUrl = result.url;
            } catch (uploadErr) {
              console.error("Image upload failed:", uploadErr);
              toast.error(`Image upload failed for item: ${item.translations[0]?.title || "unknown"}`);
              // Continue saving — just skip the image
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
          } else {
            // Update the newly created item with image URL
            if (imageUrl) {
              await supabase
                .from("menu_items")
                .update({ image_url: imageUrl })
                .eq("id", itemId);
            }
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
      }

      // Invalidate cache via API
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId: currentMenuId }),
      }).catch(() => {});

      toast.success("Menu saved successfully!");
      if (isNew) {
        router.push(`/admin/menus/${currentMenuId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save menu");
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/menus">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-2xl font-bold">
                {isNew ? t.admin.menus.create : t.admin.menus.edit}
              </h1>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-espresso text-warm hover:bg-espresso/90"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Menu
          </Button>
        </div>
      </FadeIn>

      {/* Menu settings */}
      <FadeIn delay={0.1}>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Menu Slug</Label>
                <Input
                  value={menuSlug}
                  onChange={(e) => setMenuSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="main-menu"
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={menuActive} onCheckedChange={setMenuActive} />
                <Label className="text-sm">{menuActive ? t.admin.menus.active : t.admin.menus.inactive}</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Language tabs */}
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

          {SUPPORTED_LANGUAGES.map((lang) => (
            <TabsContent key={lang.code} value={lang.code}>
              <div className="space-y-4 pt-2">
                {categories.map((cat, catIdx) => {
                  const catTr = cat.translations.find((t) => t.language === langTab);
                  return (
                    <motion.div
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIdx * 0.05 }}
                    >
                      <Card className="border-border/50">
                        <CardHeader className="p-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                updateCategory(catIdx, { expanded: !cat.expanded })
                              }
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {cat.expanded ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronRight size={18} />
                              )}
                            </button>
                            <div className="flex-1">
                              <Input
                                placeholder="Category name"
                                value={catTr?.title ?? ""}
                                onChange={(e) =>
                                  updateCategoryTranslation(catIdx, "title", e.target.value)
                                }
                                className="h-9 text-sm font-semibold border-0 px-0 shadow-none focus-visible:ring-0"
                              />
                            </div>
                            <Switch
                              checked={cat.is_active}
                              onCheckedChange={(checked) =>
                                updateCategory(catIdx, { is_active: checked })
                              }
                              className="scale-75"
                            />
                            <button
                              onClick={() => removeCategory(catIdx)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </CardHeader>

                        <AnimatePresence>
                          {cat.expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <CardContent className="p-4 pt-0 space-y-2">
                                <Input
                                  placeholder="Category description (optional)"
                                  value={catTr?.description ?? ""}
                                  onChange={(e) =>
                                    updateCategoryTranslation(catIdx, "description", e.target.value)
                                  }
                                  className="h-8 text-xs mb-3"
                                />

                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleDragEnd(catIdx)}
                                >
                                  <SortableContext
                                    items={cat.items.map((i) => i.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="space-y-2">
                                      {cat.items.map((item, itemIdx) => (
                                        <SortableItem
                                          key={item.id}
                                          item={item}
                                          categoryIndex={catIdx}
                                          itemIndex={itemIdx}
                                          onUpdate={updateItem}
                                          onRemove={removeItem}
                                          langTab={langTab}
                                          saving={saving}
                                        />
                                      ))}
                                    </div>
                                  </SortableContext>
                                </DndContext>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addItem(catIdx)}
                                  className="mt-2 gap-1.5 border-dashed text-xs"
                                >
                                  <Plus size={14} />
                                  {t.admin.menus.addItem}
                                </Button>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}

                {/* Add category */}
                <Button
                  variant="outline"
                  onClick={addCategory}
                  className="w-full gap-2 border-dashed"
                >
                  <Plus size={16} />
                  {t.admin.menus.addCategory}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </FadeIn>
    </div>
  );
}

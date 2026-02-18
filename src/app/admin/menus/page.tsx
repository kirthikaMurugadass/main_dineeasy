"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreVertical, Eye, EyeOff, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FadeIn, StaggerContainer, StaggerItem, HoverScale } from "@/components/motion";
import { useI18n } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface MenuEntry {
  id: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  title: string;
  category_count: number;
}

export default function MenusPage() {
  const { t } = useI18n();
  const [menus, setMenus] = useState<MenuEntry[]>([]);
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMenus() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id, slug")
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) {
      setLoading(false);
      return;
    }

    setRestaurantSlug(restaurant.slug);

    const { data: menuData } = await supabase
      .from("menus")
      .select("id, slug, is_active, created_at")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false });

    if (!menuData) {
      setLoading(false);
      return;
    }

    // Get translations for menu titles
    const menuIds = menuData.map((m) => m.id);
    const { data: translations } = await supabase
      .from("translations")
      .select("entity_id, title")
      .eq("entity_type", "menu")
      .eq("language", "en")
      .in("entity_id", menuIds);

    // Get category counts
    const { data: categories } = await supabase
      .from("categories")
      .select("id, menu_id")
      .in("menu_id", menuIds);

    const titleMap = new Map(translations?.map((tr) => [tr.entity_id, tr.title]) ?? []);
    const catCountMap = new Map<string, number>();
    categories?.forEach((c) => {
      catCountMap.set(c.menu_id, (catCountMap.get(c.menu_id) ?? 0) + 1);
    });

    setMenus(
      menuData.map((m) => ({
        id: m.id,
        slug: m.slug,
        is_active: m.is_active,
        created_at: m.created_at,
        title: titleMap.get(m.id) ?? m.slug,
        category_count: catCountMap.get(m.id) ?? 0,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadMenus();
  }, []);

  async function toggleMenu(id: string, active: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("menus")
      .update({ is_active: !active })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update menu");
      return;
    }
    toast.success(active ? "Menu deactivated" : "Menu activated");
    loadMenus();
  }

  async function deleteMenu(id: string) {
    if (!confirm("Are you sure you want to delete this menu?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("menus").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete menu");
      return;
    }
    toast.success("Menu deleted");
    loadMenus();
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">{t.admin.menus.title}</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your digital menus, categories, and items
            </p>
          </div>
          <Link href="/admin/menus/new">
            <Button className="gap-2 bg-espresso text-warm hover:bg-espresso/90">
              <Plus size={16} />
              {t.admin.menus.create}
            </Button>
          </Link>
        </div>
      </FadeIn>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6">
                <div className="space-y-3 animate-pulse">
                  <div className="h-5 w-1/3 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-8 w-20 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : menus.length === 0 ? (
        <FadeIn delay={0.2}>
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-gold/10 p-4">
                <Plus size={24} className="text-gold" />
              </div>
              <h3 className="text-lg font-semibold">No menus yet</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Create your first digital menu to get started. Add categories, items, and share via QR code.
              </p>
              <Link href="/admin/menus/new" className="mt-6">
                <Button className="bg-espresso text-warm hover:bg-espresso/90">
                  {t.admin.menus.create}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2">
          {menus.map((menu) => (
            <StaggerItem key={menu.id}>
              <HoverScale lift={-3}>
                <Card className="border-border/50 transition-colors hover:border-gold/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{menu.title}</h3>
                          <Badge
                            variant={menu.is_active ? "default" : "secondary"}
                            className={menu.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                          >
                            {menu.is_active ? t.admin.menus.active : t.admin.menus.inactive}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          /{restaurantSlug}/{menu.slug} · {menu.category_count} categories
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/menus/${menu.id}`}>
                              <Pencil size={14} className="mr-2" />
                              {t.admin.menus.edit}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a
                              href={`/${restaurantSlug}/${menu.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={14} className="mr-2" />
                              View Public
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMenu(menu.id, menu.is_active)}>
                            {menu.is_active ? (
                              <>
                                <EyeOff size={14} className="mr-2" /> Deactivate
                              </>
                            ) : (
                              <>
                                <Eye size={14} className="mr-2" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMenu(menu.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </HoverScale>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}

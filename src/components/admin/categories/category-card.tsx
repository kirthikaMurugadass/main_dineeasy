"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Edit2, Plus, Trash2, Eye, EyeOff, MoreVertical, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { Language } from "@/types/database";

interface CategoryItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

interface CategoryCardProps {
  id: string;
  name: string;
  itemCount: number;
  activeItemCount: number;
  is_active: boolean;
  image_url: string | null;
  items: CategoryItem[];
  avgPrice: number;
  language: Language;
  onToggleActive: (id: string, currentActive: boolean) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function CategoryCard({
  id,
  name,
  itemCount,
  activeItemCount,
  is_active,
  image_url: categoryImageUrl,
  items,
  avgPrice,
  language,
  onToggleActive,
  onDelete,
  deleting = false,
}: CategoryCardProps) {
  const { t, language: currentLang } = useI18n();
  // German & Italian have longer "Add Item" labels — use compact stacked layout
  const needsCompactButtons = currentLang === "de" || currentLang === "it";
  const featuredItems = items.filter((item) => item.is_active).slice(0, 4);
  const remainingCount = itemCount - featuredItems.length;

  // Generate gradient based on category name (consistent color per category)
  const gradientColors = [
    "from-amber-500/20 via-orange-500/20 to-red-500/20",
    "from-blue-500/20 via-indigo-500/20 to-purple-500/20",
    "from-green-500/20 via-emerald-500/20 to-teal-500/20",
    "from-pink-500/20 via-rose-500/20 to-fuchsia-500/20",
    "from-cyan-500/20 via-sky-500/20 to-blue-500/20",
  ];
  const gradientIndex = name.charCodeAt(0) % gradientColors.length;
  const gradient = gradientColors[gradientIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-gold/30 hover:shadow-lg hover:shadow-gold/10 p-0">
        {/* Banner Image / Gradient - prefer category image, fallback to first item image */}
        <div
          className={cn(
            "relative h-32 w-full overflow-hidden",
            !categoryImageUrl && !items.some((i) => i.image_url) && `bg-gradient-to-br ${gradient}`
          )}
        >
          {(categoryImageUrl || items.find((i) => i.image_url)?.image_url) ? (
            <div className="relative h-full w-full">
              <Image
                src={categoryImageUrl || items.find((i) => i.image_url)!.image_url!}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl opacity-20">🍽️</div>
            </div>
          )}

          {/* Category Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white drop-shadow-lg">{name}</h3>
              <Badge
                variant={is_active ? "default" : "secondary"}
                className={cn(
                  "backdrop-blur-sm",
                  is_active
                    ? "bg-green-500/90 text-white border-green-400/50"
                    : "bg-gray-500/90 text-white border-gray-400/50"
                )}
              >
                {is_active ? t.admin.menus.active : t.admin.menus.inactive}
              </Badge>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                >
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleActive(id, is_active)}>
                  {is_active ? (
                    <>
                      <EyeOff size={14} className="mr-2" /> {t.admin.categories.deactivate}
                    </>
                  ) : (
                    <>
                      <Eye size={14} className="mr-2" /> {t.admin.categories.activate}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-destructive focus:text-destructive"
                  disabled={deleting}
                >
                  <Trash2 size={14} className="mr-2" />
                  {deleting ? t.admin.categories.deleting : t.admin.categories.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Item Preview Thumbnails */}
          {featuredItems.length > 0 ? (
            <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {featuredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative flex-shrink-0"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border/50 ring-2 ring-background">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-2xl">
                        🍽️
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-background px-1.5 text-[10px] font-semibold text-foreground shadow-sm">
                    CHF {item.price.toFixed(2)}
                  </div>
                </div>
              ))}
              {remainingCount > 0 && (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border/50 bg-muted/50 text-xs font-medium text-muted-foreground">
                  +{remainingCount}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4 flex h-16 items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/30">
              <p className="text-xs text-muted-foreground">{t.admin.categories.noItemsYet}</p>
            </div>
          )}

          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/30 p-2">
              <div className="text-muted-foreground">{t.admin.categories.items}</div>
              <div className="text-lg font-semibold">{itemCount}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-2">
              <div className="text-muted-foreground">{t.admin.menus.active}</div>
              <div className="text-lg font-semibold text-green-500">{activeItemCount}</div>
            </div>
          </div>

          {avgPrice > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-gold/10 p-2">
              <TrendingUp size={14} className="text-gold" />
              <span className="text-xs text-muted-foreground">{t.admin.categories.avgPrice}:</span>
              <span className="font-semibold text-gold">CHF {avgPrice.toFixed(2)}</span>
            </div>
          )}

          {/* Action Buttons - DE/IT: stacked + compact for long labels */}
          <div
            className={cn(
              "flex gap-2",
              needsCompactButtons ? "flex-col" : "flex-col sm:flex-row"
            )}
          >
            <Link href={`/admin/menu/category/${id}`} className="flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-full gap-1.5",
                  needsCompactButtons ? "text-xs" : "text-xs sm:text-sm"
                )}
              >
                <Edit2 size={14} className="shrink-0" />
                <span>{t.admin.categories.edit}</span>
              </Button>
            </Link>
            <Link href={`/admin/menu/category/${id}`} className="flex-1 min-w-0">
              <Button
                size="sm"
                className={cn(
                  "h-9 w-full gap-1.5 bg-espresso text-warm hover:bg-espresso/90",
                  needsCompactButtons ? "text-xs justify-center" : "text-xs sm:text-sm"
                )}
              >
                <Plus size={14} className="shrink-0" />
                <span>{t.admin.categories.addItem}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

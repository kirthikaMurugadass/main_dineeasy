"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Monitor,
  Moon,
  Leaf,
  PackageOpen,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  UtensilsCrossed,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { useCartStore } from "@/lib/stores/cart-store";
import type { Language, PublicCategory, PublicMenu, PublicMenuItem, PublicRestaurantData } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePublicTheme } from "@/components/providers/public-theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageFlag } from "@/components/ui/language-flag";

type ViewData =
  | PublicMenu
  | (PublicRestaurantData & { menu?: { id: string; slug: string } });

type Dietary = "veg" | "nonveg" | "unknown";

function getDisplayTitle(
  titleRecord: Record<Language, string> | undefined,
  lang: Language
): string {
  if (!titleRecord) return "";
  const order: Language[] = [lang, "en", "de", "fr", "it"];
  for (const l of order) {
    const v = titleRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return "";
}

function getDisplayDescription(
  descriptionRecord: Record<Language, string | null> | undefined,
  lang: Language
): string {
  if (!descriptionRecord) return "";
  const order: Language[] = [lang, "en", "de", "fr", "it"];
  for (const l of order) {
    const v = descriptionRecord[l];
    if (v && String(v).trim()) return v.trim();
  }
  return "";
}

function classifyDietary(item: PublicMenuItem): Dietary {
  const allText = Object.values(item.title ?? {})
    .concat(Object.values(item.description ?? {}) as any)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const nonVeg = [
    "chicken",
    "beef",
    "pork",
    "fish",
    "shrimp",
    "mutton",
    "bacon",
    "ham",
    "tuna",
    "salmon",
    "anchovy",
    "huhn",
    "rind",
    "schwein",
    "fisch",
    "crevette",
    "poisson",
    "viande",
    "pollo",
    "manzo",
    "maiale",
    "pesce",
    "carne",
  ];
  const veg = ["veg", "vegetarian", "veggie", "paneer", "tofu", "salad", "gemüse", "vegetar", "verdure"];

  if (nonVeg.some((k) => allText.includes(k))) return "nonveg";
  if (veg.some((k) => allText.includes(k))) return "veg";
  return "unknown";
}

function categoryIcon(category: PublicCategory, idx: number) {
  if (category.image_url) return null;
  // Keep icon mapping stable/deterministic without adding new colors.
  const icons = [UtensilsCrossed, Leaf, ShoppingCart, PackageOpen];
  const Icon = icons[idx % icons.length] ?? UtensilsCrossed;
  return <Icon className="h-5 w-5 text-muted-foreground" />;
}

function formatCurrency(currency: string, value: number) {
  // Keep existing behavior: CHF prefix is already used elsewhere.
  return `${currency} ${value.toFixed(2)}`;
}

function OrderPanel({
  restaurantSlug,
  menuId,
  ordersEnabled,
  onOrderingDisabled,
  onGoToCheckout,
  className,
}: {
  restaurantSlug: string;
  menuId: string;
  ordersEnabled: boolean;
  onOrderingDisabled: () => void;
  onGoToCheckout: () => void;
  className?: string;
}) {
  const { t, language } = useI18n();
  const posT = (t.order as any)?.public?.pos;
  const currency = t.menu?.currency || "CHF";
  const { items: cartItems, updateQuantity, removeItem, getTotal, getItemCount } =
    useCartStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const itemCount = mounted ? getItemCount() : 0;
  const total = mounted ? getTotal() : 0;
  const tax = 0;
  const totalAmount = total + tax;
  const visibleItems = mounted ? cartItems : [];

  return (
    <Card className={cn("h-full py-5", className)}>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              {posT?.orderTitle || posT?.title || "Order"}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {itemCount}{" "}
              {itemCount === 1
                ? (posT?.itemSingular || "item")
                : (posT?.itemPlural || "items")}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-auto pr-1">
            {visibleItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/20 p-6 text-center">
                <PackageOpen className="h-7 w-7 text-muted-foreground" />
                <div className="text-sm font-semibold text-foreground">
                  {posT?.emptyCart || "No items yet"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {posT?.emptyCartHint || "Add items from the menu to get started"}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={getDisplayTitle(item.title as any, language)}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <UtensilsCrossed className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm font-semibold text-foreground">
                          {getDisplayTitle(item.title as any, language) ||
                            t.menu?.untitled ||
                            "Untitled"}
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                          {formatCurrency(currency, item.price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 sm:ml-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full sm:h-8 sm:w-8"
                        aria-label={(t.menu as any)?.public?.decreaseQuantity || "Decrease quantity"}
                        onClick={() => {
                          if (item.quantity === 1) removeItem(item.id);
                          else updateQuantity(item.id, item.quantity - 1);
                        }}
                      >
                        <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </Button>
                      <div className="min-w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full sm:h-8 sm:w-8"
                        aria-label={(t.menu as any)?.public?.increaseQuantity || "Increase quantity"}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{posT?.subtotal || "Sub Total"}</span>
            <span className="font-semibold text-foreground">{formatCurrency(currency, total)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{posT?.tax || "Tax"}</span>
            <span className="font-semibold text-foreground">{formatCurrency(currency, tax)}</span>
          </div>
          <div className="mt-3 border-t border-border/60 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {posT?.totalAmount || "Total Amount"}
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(currency, totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {ordersEnabled ? (
            <Button
              type="button"
              size="lg"
              className="w-full rounded-2xl"
              onClick={onGoToCheckout}
            >
              {posT?.placeOrder || "Place Order"}
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full rounded-2xl"
              onClick={onOrderingDisabled}
            >
              {posT?.placeOrder || "Place Order"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PosDashboard({
  data,
  restaurantId,
  menuId,
  ordersEnabled,
  viewOnlyMode,
  hideOrderingChrome = false,
  onOrderingDisabled,
}: {
  data: ViewData;
  restaurantId?: string;
  menuId?: string;
  ordersEnabled: boolean;
  viewOnlyMode: boolean;
  hideOrderingChrome?: boolean;
  onOrderingDisabled: () => void;
}) {
  const router = useRouter();
  const { t, language, setLanguage, languages } = useI18n();
  const { theme, setTheme } = usePublicTheme();
  const menuPublicT = (t.menu as any)?.public;
  const posMenuT = (t.menu as any)?.public?.pos;
  const posOrderT = (t.order as any)?.public?.pos;
  const currency = t.menu?.currency || "CHF";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const categories = data.categories ?? [];

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allItems = categories.flatMap((c) =>
      (c.items ?? []).map((i) => ({ item: i, category: c }))
    );

    const filteredByCategory =
      activeCategory === "all"
        ? allItems
        : allItems.filter(({ category }) => category.id === activeCategory);

    if (!q) return filteredByCategory;

    return filteredByCategory.filter(({ item }) => {
      const title = getDisplayTitle(item.title, language).toLowerCase();
      const desc = Object.values(item.description ?? {})
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [activeCategory, categories, language, query]);

  const { items: cartItems, addItem, updateQuantity, removeItem, getItemCount } =
    useCartStore();

  const restaurantSlug = data.restaurant.slug;
  const showOrderingUi = !viewOnlyMode;
  const showOrderingChrome = showOrderingUi && !hideOrderingChrome;
  const itemCount = mounted ? getItemCount() : 0;
  const hasCart = itemCount > 0;
  const visibleCartItems = mounted ? cartItems : [];
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const hasSetFreeDefaultThemeRef = useRef(false);

  useEffect(() => {
    // Free plan should default to light for menu readability.
    if (!viewOnlyMode || hasSetFreeDefaultThemeRef.current) return;
    hasSetFreeDefaultThemeRef.current = true;
    if (theme !== "light") {
      setTheme("light", { persist: false });
    }
  }, [viewOnlyMode, theme, setTheme]);

  const handleGoToCheckout = () => {
    if (viewOnlyMode) return;
    if (!menuId) return;
    if (!ordersEnabled) {
      onOrderingDisabled();
      return;
    }
    if (!mounted || itemCount <= 0) {
      toast.error(
        posOrderT?.toasts?.selectItemBeforeOrder ||
          "Please select at least one item before placing the order."
      );
      return;
    }
    router.push(`/public-menu/${restaurantSlug}/${menuId}/checkout`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div
        className={cn(
          "mx-auto grid w-full max-w-[95rem] grid-cols-1 gap-4 p-3 sm:p-4",
          showOrderingChrome
            ? "lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_360px]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]"
        )}
      >
        {/* Left Sidebar */}
        {showOrderingUi ? (
        <aside className="hidden lg:block">
          <Card className="h-[calc(100vh-2rem)] py-5">
            <CardContent className="flex h-full flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-muted">
                  {data.restaurant.logo_url ? (
                    <Image
                      src={data.restaurant.logo_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="44px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                      {data.restaurant.name?.slice(0, 1)?.toUpperCase() || "R"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">
                    {data.restaurant.name}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  {posMenuT?.navigation || "Navigation"}
                </div>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-3 text-sm font-semibold shadow-soft transition hover:shadow-card",
                      activeCategory === "all" && "bg-primary/10 border-primary/20"
                    )}
                  >
                    <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 text-left">
                      {posMenuT?.allCategories || "All"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {categories.reduce((n, c) => n + (c.items?.length ?? 0), 0)}
                    </span>
                  </button>

                  {categories.map((cat, idx) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-3 text-sm font-semibold shadow-soft transition hover:shadow-card",
                        activeCategory === cat.id && "bg-primary/10 border-primary/20"
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-muted">
                        {cat.image_url ? (
                          <Image
                            src={cat.image_url}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 object-cover"
                            unoptimized
                          />
                        ) : (
                          categoryIcon(cat, idx)
                        )}
                      </div>
                      <span className="min-w-0 flex-1 truncate text-left">
                        {getDisplayTitle(cat.title, language) || t.menu?.untitled || "Untitled"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cat.items?.length ?? 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                {showOrderingChrome && menuId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-2xl justify-between"
                    onClick={handleGoToCheckout}
                  >
                    <span className="inline-flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      {menuPublicT?.cart || "Cart"}
                    </span>
                    <span className="text-xs text-muted-foreground">{itemCount}</span>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </aside>
        ) : null}

        {/* Main */}
        <section className="min-w-0">
          <Card className="py-5">
            <CardContent className="space-y-4">
              {!showOrderingUi ? (
                <div className="text-center">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl font-serif">
                    {data.restaurant.name}
                  </h1>
                  <p className="mt-1 text-sm font-medium tracking-wide text-muted-foreground sm:text-base">
                    {menuPublicT?.heroTitle || "Our Menu"}
                  </p>
                </div>
              ) : null}

              {/* Mobile/tablet header (restaurant identity) */}
              <div className={cn("flex items-center gap-3 lg:hidden", !showOrderingUi && "hidden")}>
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-muted">
                  {data.restaurant.logo_url ? (
                    <Image
                      src={data.restaurant.logo_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold">
                      {data.restaurant.name?.slice(0, 1)?.toUpperCase() || "R"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{data.restaurant.name}</div>
                </div>
              </div>

              {/* Top bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:flex-1 sm:max-w-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      posMenuT?.searchPlaceholder ||
                      menuPublicT?.searchPlaceholder ||
                      "Search product here..."
                    }
                    className="h-11 rounded-2xl pl-10 text-sm"
                  />
                </div>

                {/* Actions (theme / language / cart) */}
                {menuId && (
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                    {/* Language */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 rounded-2xl"
                          aria-label={menuPublicT?.switchLanguage || "Switch language"}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 rounded-xl border border-border/70 bg-card p-1 shadow-xl"
                      >
                        {languages
                          ?.filter((entry) => data.availableLanguages.includes(entry.code))
                          .map((entry) => (
                            <DropdownMenuItem
                              key={entry.code}
                              onClick={() => setLanguage(entry.code)}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                language === entry.code
                                  ? "bg-accent text-accent-foreground shadow-sm"
                                  : "text-foreground hover:bg-muted/60"
                              )}
                            >
                              <LanguageFlag code={entry.code} className="h-4 w-4" />
                              <span className="flex-1 text-left">{entry.label}</span>
                              {language === entry.code && (
                                <span className="text-primary text-xs">✓</span>
                              )}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 rounded-2xl"
                          aria-label={menuPublicT?.toggleTheme || "Toggle theme"}
                        >
                          <ThemeIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl border border-border/70 bg-card p-1 shadow-xl"
                      >
                        <DropdownMenuItem
                          onClick={() => setTheme("light")}
                          className="rounded-lg py-2.5 text-sm"
                        >
                          <Sun className="mr-2 h-4 w-4" /> {menuPublicT?.themeLight || "Light"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTheme("dark")}
                          className="rounded-lg py-2.5 text-sm"
                        >
                          <Moon className="mr-2 h-4 w-4" /> {menuPublicT?.themeDark || "Dark"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTheme("system")}
                          className="rounded-lg py-2.5 text-sm"
                        >
                          <Monitor className="mr-2 h-4 w-4" /> {menuPublicT?.themeSystem || "System"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {showOrderingChrome ? (
                      <>
                        {/* Reserve table */}
                        <Button
                          type="button"
                          onClick={() => router.push(`/r/${restaurantSlug}/book-table`)}
                          className="h-11 flex-1 rounded-2xl px-5 text-sm font-semibold sm:min-w-[190px] sm:flex-none"
                        >
                          {menuPublicT?.reserveTable || "Reserve a Table"}
                        </Button>

                        {/* Mobile: Cart drawer trigger */}
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-2xl lg:hidden">
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              {menuPublicT?.cart || "Cart"}
                              {hasCart && (
                                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                                  {itemCount}
                                </span>
                              )}
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right" className="p-0 w-full sm:max-w-sm">
                            <SheetHeader className="border-b border-border/60">
                              <SheetTitle className="text-sm font-bold">
                                {menuPublicT?.cart || "Cart"}
                              </SheetTitle>
                            </SheetHeader>
                            <div className="h-[calc(100vh-3.5rem)] p-4">
                              <OrderPanel
                                restaurantSlug={restaurantSlug}
                                menuId={menuId}
                                ordersEnabled={ordersEnabled}
                                onOrderingDisabled={onOrderingDisabled}
                                onGoToCheckout={handleGoToCheckout}
                                className="h-full"
                              />
                            </div>
                          </SheetContent>
                        </Sheet>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Horizontal Categories */}
              <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={cn(
                    "snap-start flex min-w-[140px] items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2.5 shadow-soft transition hover:shadow-card sm:min-w-[160px] sm:px-4 sm:py-3",
                    activeCategory === "all" && "bg-primary/10 border-primary/20"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                    <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-[13px] font-semibold sm:text-sm">
                      {posMenuT?.allCategories || "All"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categories.reduce((n, c) => n + (c.items?.length ?? 0), 0)}{" "}
                      {posMenuT?.itemsLabel || "items"}
                    </div>
                  </div>
                </button>

                {categories.map((cat, idx) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "snap-start flex min-w-[160px] items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2.5 shadow-soft transition hover:shadow-card sm:min-w-[200px] sm:px-4 sm:py-3",
                      activeCategory === cat.id && "bg-primary/10 border-primary/20"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-muted">
                      {cat.image_url ? (
                        <Image
                          src={cat.image_url}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                          unoptimized
                        />
                      ) : (
                        categoryIcon(cat, idx)
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-[13px] font-semibold sm:text-sm">
                        {getDisplayTitle(cat.title, language) || t.menu?.untitled || "Untitled"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {cat.items?.length ?? 0} {posMenuT?.itemsLabel || "items"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Products */}
              <div
                className={cn(
                  "grid gap-3 sm:gap-4",
                  showOrderingUi
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1 md:grid-cols-2"
                )}
              >
                {items.map(({ item }) => {
                  const cartItem = visibleCartItems.find((ci) => ci.id === item.id);
                  const quantity = mounted ? (cartItem?.quantity ?? 0) : 0;
                  const dietary = classifyDietary(item);
                  const itemTitle =
                    getDisplayTitle(item.title, language) || t.menu?.untitled || "Untitled";
                  const itemDescription = getDisplayDescription(item.description, language);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group overflow-hidden border border-border/60 bg-card transition",
                        showOrderingUi
                          ? "rounded-3xl shadow-card hover:-translate-y-0.5 hover:shadow-floating"
                          : "rounded-2xl p-4 shadow-sm"
                      )}
                    >
                      {showOrderingUi ? (
                        <>
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={itemTitle}
                                fill
                                className="object-cover transition duration-300 group-hover:scale-[1.02]"
                                sizes="(min-width: 1280px) 240px, (min-width: 640px) 220px, 180px"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <UtensilsCrossed className="h-8 w-8" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 p-3 sm:p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
                                  {itemTitle}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(currency, item.price_chf)}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span
                                      className={cn(
                                        "h-2 w-2 rounded-full",
                                        dietary === "veg" && "bg-primary",
                                        dietary === "nonveg" && "bg-destructive",
                                        dietary === "unknown" && "bg-muted-foreground/40"
                                      )}
                                    />
                                    <span className="truncate text-muted-foreground">
                                      {dietary === "veg"
                                        ? ((t.order as any)?.public?.pos?.veg || "Veg")
                                        : dietary === "nonveg"
                                        ? ((t.order as any)?.public?.pos?.nonVeg || "Non Veg")
                                        : ((t.order as any)?.public?.pos?.unknownDiet || "—")}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {showOrderingChrome ? (
                              <div className="pt-1">
                                {ordersEnabled ? (
                                  quantity > 0 ? (
                                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-3 py-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-full sm:h-8 sm:w-8"
                                        aria-label={menuPublicT?.decreaseQuantity || "Decrease quantity"}
                                        onClick={() => {
                                          if (quantity === 1) removeItem(item.id);
                                          else updateQuantity(item.id, quantity - 1);
                                        }}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="text-sm font-semibold text-foreground">
                                        {quantity}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 rounded-full sm:h-8 sm:w-8"
                                        aria-label={menuPublicT?.increaseQuantity || "Increase quantity"}
                                        onClick={() => updateQuantity(item.id, quantity + 1)}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      type="button"
                                      className="w-full rounded-2xl"
                                      onClick={() =>
                                        addItem({
                                          id: item.id,
                                          title: item.title,
                                          description: item.description,
                                          price: item.price_chf,
                                          image_url: item.image_url,
                                        })
                                      }
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      {menuPublicT?.add || "Add"}
                                    </Button>
                                  )
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full rounded-2xl"
                                    onClick={onOrderingDisabled}
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {menuPublicT?.addOrderingDisabled || "Add (ordering disabled)"}
                                  </Button>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:h-20 sm:w-20">
                            {item.image_url ? (
                              <Image
                                src={item.image_url}
                                alt={itemTitle}
                                fill
                                className="object-cover"
                                sizes="80px"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <UtensilsCrossed className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-base font-semibold text-foreground">
                              {itemTitle}
                            </div>
                            {itemDescription ? (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {itemDescription}
                              </p>
                            ) : null}
                            <div className="mt-2 text-sm font-semibold text-foreground">
                              {formatCurrency(currency, item.price_chf)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right Order Panel (desktop only) */}
        {showOrderingChrome ? (
          <aside className="hidden xl:block">
            {menuId ? (
              <div className="h-[calc(100vh-2rem)]">
                <OrderPanel
                  restaurantSlug={restaurantSlug}
                  menuId={menuId}
                  ordersEnabled={ordersEnabled}
                  onOrderingDisabled={onOrderingDisabled}
                  onGoToCheckout={handleGoToCheckout}
                  className="h-full"
                />
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>

      {/* Bottom bar (mobile/tablet) */}
      {showOrderingChrome && menuId && (
        <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-[95rem] items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {data.restaurant.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {hasCart
                  ? `${itemCount} ${itemCount === 1 ? (posMenuT?.itemSingular || "item") : (posMenuT?.itemPlural || "items")}`
                  : (posMenuT?.emptyCart || "No items yet")}
              </div>
            </div>
            <Button className="rounded-2xl" onClick={handleGoToCheckout}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {posMenuT?.placeOrder || "Place Order"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


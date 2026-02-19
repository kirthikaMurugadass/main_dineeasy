/* ─── DineEasy Database Types ─── */

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  theme_config: ThemeConfig;
  qr_url: string | null;
  qr_svg: string | null;
  qr_png: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThemeConfig {
  mode: "light" | "dark" | "auto";
  primaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  headerImageUrl: string | null;
  showLogo: boolean;
}

export const defaultThemeConfig: ThemeConfig = {
  mode: "light",
  primaryColor: "#3E2723",
  accentColor: "#C6A75E",
  fontHeading: "playfair",
  fontBody: "inter",
  headerImageUrl: null,
  showLogo: true,
};

export interface Menu {
  id: string;
  restaurant_id: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  menu_id: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  price_chf: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type EntityType = "menu" | "category" | "menu_item" | "restaurant";
export type Language = "de" | "en" | "fr" | "it";

export interface Translation {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  language: Language;
  title: string;
  description: string | null;
}

/* ─── Joined types for frontend ─── */

export interface MenuItemWithTranslations extends MenuItem {
  translations: Translation[];
}

export interface CategoryWithItems extends Category {
  translations: Translation[];
  menu_items: MenuItemWithTranslations[];
}

export interface MenuWithCategories extends Menu {
  translations: Translation[];
  categories: CategoryWithItems[];
}

export interface RestaurantWithMenus extends Restaurant {
  menus: Menu[];
  translations: Translation[];
}

/* ─── Public menu (fully resolved) ─── */
export interface PublicMenu {
  restaurant: {
    name: string;
    slug: string;
    logo_url: string | null;
    theme_config: ThemeConfig;
  };
  menu: {
    id: string;
    slug: string;
  };
  categories: PublicCategory[];
  availableLanguages: Language[];
}

export interface PublicCategory {
  id: string;
  sort_order: number;
  title: Record<Language, string>;
  description: Record<Language, string | null>;
  items: PublicMenuItem[];
}

export interface PublicMenuItem {
  id: string;
  price_chf: number;
  image_url: string | null;
  sort_order: number;
  title: Record<Language, string>;
  description: Record<Language, string | null>;
}

/* ─── Public restaurant view (all menus combined) ─── */
export interface PublicRestaurantData {
  restaurant: {
    name: string;
    slug: string;
    logo_url: string | null;
    theme_config: ThemeConfig;
  };
  categories: PublicCategory[];
  availableLanguages: Language[];
}

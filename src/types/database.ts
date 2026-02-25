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

export interface HeroBannerConfig {
  backgroundType: "image" | "gradient" | "solid";
  backgroundImage: string | null;
  gradientStart: string;
  gradientEnd: string;
  gradientDirection: "to-r" | "to-b" | "to-br" | "to-bl";
  solidColor: string;
  overlayColor: string;
  overlayOpacity: number; // 0-80
  title: string;
  subtitle: string;
  textAlign: "left" | "center" | "right";
  fontSize: number; // in rem
  fontWeight: "300" | "400" | "500" | "600" | "700";
  showCta: boolean;
  ctaText: string;
  ctaLink: string;
  ctaStyle: "solid" | "outline";
}

export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  accentFont?: string;
  headingWeight: "300" | "400" | "500" | "600" | "700" | "800";
  bodyWeight: "300" | "400" | "500" | "600" | "700" | "800";
  heroTitleSize: number; // rem
  sectionHeadingSize: number; // rem
  categoryTitleSize: number; // rem
  itemNameSize: number; // rem
  itemDescriptionSize: number; // rem
  priceSize: number; // rem
  lineHeight: number; // multiplier (e.g., 1.5)
  letterSpacing: number; // em (e.g., 0.01)
  paragraphSpacing: boolean;
  textPrimary: string | null; // null = auto
  textSecondary: string | null; // null = auto
  textMuted: string | null; // null = auto
  readableMode: boolean;
  preset?: "modern" | "elegant" | "minimal" | "classic" | "premium" | null;
}

export interface ThemeConfig {
  mode: "light" | "dark" | "auto";
  primaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  headerImageUrl: string | null;
  showLogo: boolean;
  heroBanner?: HeroBannerConfig;
  typography?: TypographyConfig;
}

export const defaultHeroBannerConfig: HeroBannerConfig = {
  backgroundType: "image",
  backgroundImage: null,
  gradientStart: "#1a1714",
  gradientEnd: "#3a2f28",
  gradientDirection: "to-b",
  solidColor: "#1a1714",
  overlayColor: "#000000",
  overlayOpacity: 65,
  title: "Our Menu",
  subtitle: "DELICIOUS & AMAZING",
  textAlign: "center",
  fontSize: 4.5,
  fontWeight: "300",
  showCta: false,
  ctaText: "Order Now",
  ctaLink: "",
  ctaStyle: "solid",
};

export const defaultTypographyConfig: TypographyConfig = {
  headingFont: "playfair",
  bodyFont: "inter",
  accentFont: undefined,
  headingWeight: "400",
  bodyWeight: "400",
  heroTitleSize: 4.5,
  sectionHeadingSize: 2.5,
  categoryTitleSize: 1.5,
  itemNameSize: 1.1,
  itemDescriptionSize: 0.875,
  priceSize: 1.125,
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphSpacing: true,
  textPrimary: null,
  textSecondary: null,
  textMuted: null,
  readableMode: false,
  preset: null,
};

export const defaultThemeConfig: ThemeConfig = {
  mode: "light",
  primaryColor: "#3E2723",
  accentColor: "#C6A75E",
  fontHeading: "playfair",
  fontBody: "inter",
  headerImageUrl: null,
  showLogo: true,
  heroBanner: defaultHeroBannerConfig,
  typography: defaultTypographyConfig,
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
  image_url: string | null;
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
  image_url: string | null;
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

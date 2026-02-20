import type { Language } from "@/types/database";

/* eslint-disable @typescript-eslint/no-empty-object-type */
interface FeatureEntry { title: string; description: string }
interface StepEntry { title: string; description: string }

interface Dictionary {
  landing: {
    nav: { features: string; demo: string; pricing: string; login: string; cta: string };
    hero: { badge: string; title: string; titleAccent: string; subtitle: string; cta: string; ctaSecondary: string };
    features: {
      title: string; subtitle: string;
      qr: FeatureEntry; multilang: FeatureEntry; themes: FeatureEntry;
      publish: FeatureEntry; mobile: FeatureEntry; analytics: FeatureEntry;
    };
    demo: { title: string; subtitle: string };
    howItWorks: { title: string; subtitle: string; step1: StepEntry; step2: StepEntry; step3: StepEntry };
    cta: { title: string; subtitle: string; button: string };
    footer: { tagline: string; product: string; company: string; legal: string };
  };
  menu: { language: string; currency: string; poweredBy: string };
  admin: {
    dashboard: { title: string; welcome: string; totalCategories: string; activeCategories: string; quickCreate: string };
    menus: { title: string; create: string; edit: string; categories: string; items: string; addCategory: string; addItem: string; active: string; inactive: string };
    appearance: { title: string; theme: string; colors: string; typography: string; logo: string };
    qr: { title: string; generate: string; download: string; print: string };
  };
}

const en: Dictionary = {
  landing: {
    nav: {
      features: "Features",
      demo: "Demo",
      pricing: "Pricing",
      login: "Sign In",
      cta: "Create Free Menu",
    },
    hero: {
      badge: "Made for Cafés & Restaurants",
      title: "Where Dining Meets",
      titleAccent: "Digital Elegance.",
      subtitle:
        "Transform your café or restaurant with seamless QR menus. Because great food deserves a great presentation.",
      cta: "Create Free Menu",
      ctaSecondary: "See Demo",
    },
    features: {
      title: "Everything your café & restaurant needs",
      subtitle: "Powerful features, beautifully simple",
      qr: {
        title: "QR Code Generator",
        description: "Print-ready QR codes that link directly to your digital menu",
      },
      multilang: {
        title: "Multi-Language",
        description: "German, English, French & Italian — auto-detected for guests",
      },
      themes: {
        title: "Beautiful Themes",
        description: "Premium designs that match your restaurant's brand identity",
      },
      publish: {
        title: "Instant Publishing",
        description: "Update your menu and see changes live immediately",
      },
      mobile: {
        title: "Mobile Optimized",
        description: "Lightning-fast menus designed for every screen size",
      },
      analytics: {
        title: "Easy Management",
        description: "Drag and drop editor with category organization",
      },
    },
    demo: {
      title: "See it in action",
      subtitle: "A real preview of your digital menu experience",
    },
    howItWorks: {
      title: "How it works",
      subtitle: "Three simple steps to your digital menu",
      step1: { title: "Create Menu", description: "Add your dishes, prices, and descriptions in multiple languages" },
      step2: { title: "Customize Design", description: "Choose colors, fonts, and themes that match your brand" },
      step3: { title: "Share & Print", description: "Generate QR codes and share your menu with the world" },
    },
    cta: {
      title: "Ready to go digital?",
      subtitle: "Join Swiss cafés and restaurants already using DineEasy to delight their guests.",
      button: "Get Started",
    },
    footer: {
      tagline: "Digital menus for cafés & restaurants",
      product: "Product",
      company: "Company",
      legal: "Legal",
    },
  },
  menu: {
    language: "Language",
    currency: "CHF",
    poweredBy: "Powered by DineEasy",
  },
  admin: {
    dashboard: {
      title: "Dashboard",
      welcome: "Welcome back",
      totalCategories: "Total Categories",
      activeCategories: "Active Categories",
      quickCreate: "Create New Menu",
    },
    menus: {
      title: "Menus",
      create: "New Menu",
      edit: "Edit Menu",
      categories: "Categories",
      items: "Items",
      addCategory: "Add Category",
      addItem: "Add Item",
      active: "Active",
      inactive: "Inactive",
    },
    appearance: {
      title: "Appearance",
      theme: "Theme",
      colors: "Colors",
      typography: "Typography",
      logo: "Logo",
    },
    qr: {
      title: "QR Codes",
      generate: "Generate",
      download: "Download",
      print: "Print Ready",
    },
  },
};

const de: Dictionary = {
  landing: {
    nav: {
      features: "Funktionen",
      demo: "Demo",
      pricing: "Preise",
      login: "Anmelden",
      cta: "Menü erstellen",
    },
    hero: {
      badge: "Für Cafés & Restaurants",
      title: "Köstliche Gerichte geniessen.",
      titleAccent: "Jederzeit, überall.",
      subtitle:
        "Geniessen Sie köstliche Gerichte mit frischen Zutaten und intensiven Aromen. Bestellen Sie einfach und geniessen Sie Restaurantqualität jederzeit und überall.",
      cta: "Jetzt bestellen",
      ctaSecondary: "Menü ansehen",
    },
    features: {
      title: "Alles was Ihr Café & Restaurant braucht",
      subtitle: "Leistungsstarke Funktionen, wunderschön einfach",
      qr: {
        title: "QR-Code Generator",
        description: "Druckfertige QR-Codes, die direkt zu Ihrem digitalen Menü führen",
      },
      multilang: {
        title: "Mehrsprachig",
        description: "Deutsch, Englisch, Französisch & Italienisch — automatisch erkannt",
      },
      themes: {
        title: "Schöne Themes",
        description: "Premium-Designs, die zur Marke Ihres Restaurants passen",
      },
      publish: {
        title: "Sofort veröffentlichen",
        description: "Aktualisieren Sie Ihr Menü und sehen Sie Änderungen sofort live",
      },
      mobile: {
        title: "Mobil optimiert",
        description: "Blitzschnelle Menüs für jede Bildschirmgrösse",
      },
      analytics: {
        title: "Einfache Verwaltung",
        description: "Drag & Drop Editor mit Kategorieorganisation",
      },
    },
    demo: {
      title: "In Aktion sehen",
      subtitle: "Eine echte Vorschau Ihres digitalen Menüerlebnisses",
    },
    howItWorks: {
      title: "So funktioniert's",
      subtitle: "Drei einfache Schritte zu Ihrem digitalen Menü",
      step1: { title: "Menü erstellen", description: "Fügen Sie Gerichte, Preise und Beschreibungen in mehreren Sprachen hinzu" },
      step2: { title: "Design anpassen", description: "Wählen Sie Farben, Schriften und Themes für Ihre Marke" },
      step3: { title: "Teilen & Drucken", description: "Generieren Sie QR-Codes und teilen Sie Ihr Menü" },
    },
    cta: {
      title: "Bereit für digital?",
      subtitle: "Schliessen Sie sich Schweizer Cafés und Restaurants an, die DineEasy bereits nutzen.",
      button: "Kostenlos starten — Keine Karte nötig",
    },
    footer: {
      tagline: "Digitale Menüs für Cafés & Restaurants",
      product: "Produkt",
      company: "Unternehmen",
      legal: "Rechtliches",
    },
  },
  menu: {
    language: "Sprache",
    currency: "CHF",
    poweredBy: "Powered by DineEasy",
  },
  admin: {
    dashboard: {
      title: "Dashboard",
      welcome: "Willkommen zurück",
      totalCategories: "Alle Kategorien",
      activeCategories: "Aktive Kategorien",
      quickCreate: "Neues Menü erstellen",
    },
    menus: {
      title: "Menüs",
      create: "Neues Menü",
      edit: "Menü bearbeiten",
      categories: "Kategorien",
      items: "Artikel",
      addCategory: "Kategorie hinzufügen",
      addItem: "Artikel hinzufügen",
      active: "Aktiv",
      inactive: "Inaktiv",
    },
    appearance: {
      title: "Erscheinungsbild",
      theme: "Theme",
      colors: "Farben",
      typography: "Typografie",
      logo: "Logo",
    },
    qr: {
      title: "QR-Codes",
      generate: "Generieren",
      download: "Herunterladen",
      print: "Druckfertig",
    },
  },
};

const fr: Dictionary = {
  landing: {
    nav: {
      features: "Fonctionnalités",
      demo: "Démo",
      pricing: "Tarifs",
      login: "Connexion",
      cta: "Créer un menu",
    },
    hero: {
      badge: "Pour cafés et restaurants",
      title: "Savourez des plats délicieux.",
      titleAccent: "Partout, à tout moment.",
      subtitle:
        "Savourez des plats délicieux préparés avec des ingrédients frais et des saveurs riches. Commandez facilement et dégustez une cuisine de qualité restaurant, où que vous soyez.",
      cta: "Commander maintenant",
      ctaSecondary: "Voir le menu",
    },
    features: {
      title: "Tout ce dont votre café et restaurant ont besoin",
      subtitle: "Des fonctionnalités puissantes, magnifiquement simples",
      qr: { title: "Générateur QR", description: "Codes QR prêts à imprimer liés à votre menu digital" },
      multilang: { title: "Multilingue", description: "Allemand, anglais, français & italien — détection auto" },
      themes: { title: "Beaux thèmes", description: "Designs premium correspondant à votre marque" },
      publish: { title: "Publication instantanée", description: "Mettez à jour et voyez les changements en direct" },
      mobile: { title: "Optimisé mobile", description: "Menus ultra-rapides pour chaque écran" },
      analytics: { title: "Gestion facile", description: "Éditeur glisser-déposer avec organisation par catégorie" },
    },
    demo: { title: "Voyez en action", subtitle: "Un aperçu réel de votre menu digital" },
    howItWorks: {
      title: "Comment ça marche",
      subtitle: "Trois étapes simples vers votre menu digital",
      step1: { title: "Créer le menu", description: "Ajoutez vos plats, prix et descriptions en plusieurs langues" },
      step2: { title: "Personnaliser", description: "Choisissez couleurs, polices et thèmes pour votre marque" },
      step3: { title: "Partager", description: "Générez des QR codes et partagez votre menu" },
    },
    cta: {
      title: "Prêt à passer au digital?",
      subtitle: "Rejoignez les cafés et restaurants suisses qui utilisent déjà DineEasy.",
      button: "Commencer gratuitement",
    },
    footer: { tagline: "Menus digitaux pour cafés et restaurants", product: "Produit", company: "Entreprise", legal: "Juridique" },
  },
  menu: { language: "Langue", currency: "CHF", poweredBy: "Powered by DineEasy" },
  admin: {
    dashboard: { title: "Tableau de bord", welcome: "Bienvenue", totalCategories: "Total catégories", activeCategories: "Catégories actives", quickCreate: "Créer un menu" },
    menus: { title: "Menus", create: "Nouveau menu", edit: "Modifier", categories: "Catégories", items: "Articles", addCategory: "Ajouter catégorie", addItem: "Ajouter article", active: "Actif", inactive: "Inactif" },
    appearance: { title: "Apparence", theme: "Thème", colors: "Couleurs", typography: "Typographie", logo: "Logo" },
    qr: { title: "Codes QR", generate: "Générer", download: "Télécharger", print: "Prêt impression" },
  },
};

const it: Dictionary = {
  landing: {
    nav: {
      features: "Funzionalità",
      demo: "Demo",
      pricing: "Prezzi",
      login: "Accedi",
      cta: "Crea menu",
    },
    hero: {
      badge: "Per bar e ristoranti",
      title: "Gusta piatti deliziosi.",
      titleAccent: "Ovunque, in qualsiasi momento.",
      subtitle:
        "Gusta piatti deliziosi preparati con ingredienti freschi e sapori intensi. Ordina facilmente e assapora cibo di qualità ristorante ovunque tu sia.",
      cta: "Ordina ora",
      ctaSecondary: "Vedi il menu",
    },
    features: {
      title: "Tutto ciò di cui il tuo bar e ristorante hanno bisogno",
      subtitle: "Funzionalità potenti, splendidamente semplici",
      qr: { title: "Generatore QR", description: "Codici QR pronti per la stampa collegati al tuo menu digitale" },
      multilang: { title: "Multilingue", description: "Tedesco, inglese, francese e italiano — rilevamento auto" },
      themes: { title: "Temi eleganti", description: "Design premium che si adattano al tuo brand" },
      publish: { title: "Pubblicazione istantanea", description: "Aggiorna e vedi i cambiamenti in tempo reale" },
      mobile: { title: "Ottimizzato mobile", description: "Menu velocissimi per ogni schermo" },
      analytics: { title: "Gestione facile", description: "Editor drag & drop con organizzazione per categorie" },
    },
    demo: { title: "Guardalo in azione", subtitle: "Un'anteprima reale del tuo menu digitale" },
    howItWorks: {
      title: "Come funziona",
      subtitle: "Tre semplici passaggi per il tuo menu digitale",
      step1: { title: "Crea il menu", description: "Aggiungi piatti, prezzi e descrizioni in più lingue" },
      step2: { title: "Personalizza", description: "Scegli colori, font e temi per il tuo brand" },
      step3: { title: "Condividi", description: "Genera codici QR e condividi il tuo menu" },
    },
    cta: {
      title: "Pronto per il digitale?",
      subtitle: "Unisciti a bar e ristoranti svizzeri che usano già DineEasy.",
      button: "Inizia gratis",
    },
    footer: { tagline: "Menu digitali per bar e ristoranti", product: "Prodotto", company: "Azienda", legal: "Legale" },
  },
  menu: { language: "Lingua", currency: "CHF", poweredBy: "Powered by DineEasy" },
  admin: {
    dashboard: { title: "Dashboard", welcome: "Bentornato", totalCategories: "Categorie totali", activeCategories: "Categorie attive", quickCreate: "Crea menu" },
    menus: { title: "Menu", create: "Nuovo menu", edit: "Modifica", categories: "Categorie", items: "Articoli", addCategory: "Aggiungi categoria", addItem: "Aggiungi articolo", active: "Attivo", inactive: "Inattivo" },
    appearance: { title: "Aspetto", theme: "Tema", colors: "Colori", typography: "Tipografia", logo: "Logo" },
    qr: { title: "Codici QR", generate: "Genera", download: "Scarica", print: "Pronto stampa" },
  },
};

export const dictionaries: Record<Language, Dictionary> = {
  en,
  de,
  fr,
  it,
};

export type { Dictionary };

export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang] ?? dictionaries.de;
}

export const SUPPORTED_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

export function detectLanguage(acceptLanguage?: string): Language {
  if (!acceptLanguage) return "de";
  const langs: Language[] = ["de", "en", "fr", "it"];
  for (const lang of langs) {
    if (acceptLanguage.toLowerCase().includes(lang)) return lang;
  }
  return "de";
}

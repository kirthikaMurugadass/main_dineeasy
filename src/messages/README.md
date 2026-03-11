# Translation System Refactor

## Overview

The translation system has been refactored from a single `dictionaries.ts` file into a modular folder structure based on website sections.

## Structure

```
messages/
├── navbar/     (Navigation translations)
├── home/       (Landing page content)
├── footer/     (Footer content)
├── dashboard/  (Admin dashboard)
├── menu/       (Menu management)
├── order/      (Order management)
├── table/      (Table management - currently empty)
├── booking/    (Booking management - currently empty)
├── analytics/  (Analytics pages)
├── appearance/ (Appearance settings)
├── qr/         (QR code management)
└── settings/   (Settings pages)
```

Each section contains JSON files for each language:
- `en.json` (English)
- `de.json` (German)
- `fr.json` (French)
- `it.json` (Italian)

## Migration Status

### ✅ Completed
- Folder structure created
- Translation loader system (`src/lib/i18n/loader.ts`)
- Migration helper (`src/lib/i18n/migrate.ts`)
- Updated I18nContext to use modular system
- Navbar translations (all languages)
- Footer translations (all languages)
- Dashboard translations (all languages)

### 🚧 In Progress
- Menu translations
- Order translations
- Analytics translations
- Appearance translations
- QR translations
- Settings translations
- Home page translations

### 📝 Pending
- Table translations (currently empty)
- Booking translations (currently empty)
- Update all components to use new structure
- Remove old `dictionaries.ts` file

## Usage

### Loading Translations

```typescript
import { loadTranslations } from '@/lib/i18n/loader';

// Load a specific section
const navbarTranslations = await loadTranslations('navbar', 'en');

// Load all translations for a language
import { loadAllTranslations } from '@/lib/i18n/loader';
const allTranslations = await loadAllTranslations('en');
```

### Using in Components

```typescript
import { useI18n } from '@/lib/i18n/context';

function MyComponent() {
  const { t, language } = useI18n();
  
  // Old way: t.landing.nav.home
  // New way: t.navbar.home
  
  return <div>{t.navbar.home}</div>;
}
```

## Migration Path

1. **Phase 1**: Create all JSON files with translations (current)
2. **Phase 2**: Update components to use new structure
   - `t.landing.nav.*` → `t.navbar.*`
   - `t.admin.dashboard.*` → `t.dashboard.*`
   - `t.admin.menus.*` → `t.menu.*`
   - etc.
3. **Phase 3**: Remove old `dictionaries.ts` file
4. **Phase 4**: Remove migration helper once fully migrated

## Notes

- The system currently uses a migration helper that bridges old and new systems
- Empty sections (table, booking) can be populated as needed
- All translations are cached for performance
- The system falls back to English if a translation is missing

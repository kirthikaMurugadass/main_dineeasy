# Translation System Refactor - Status

## ✅ Completed

1. **Folder Structure**: Created modular `messages/` folder structure with all sections
2. **Translation Loader**: Created `src/lib/i18n/loader.ts` for dynamic JSON loading
3. **Migration Helper**: Created `src/lib/i18n/migrate.ts` to bridge old and new systems
4. **Updated Context**: Modified `src/lib/i18n/context.tsx` to use new modular system
5. **JSON Files Created**:
   - ✅ Navbar (en, de, fr, it)
   - ✅ Footer (en, de, fr, it)
   - ✅ Dashboard (en, de, fr, it)
   - ✅ Menu (en)
   - ✅ Order (en)
   - ✅ Analytics (en)
   - ✅ Settings (en)
   - ✅ QR (en)
   - ✅ Appearance (en)

## 🚧 In Progress

1. **Remaining JSON Files**: Need to create translations for:
   - Menu (de, fr, it)
   - Order (de, fr, it)
   - Analytics (de, fr, it)
   - Settings (de, fr, it)
   - QR (de, fr, it)
   - Appearance (de, fr, it)
   - Home section (all languages)
   - Auth section (all languages) - **NEW: Need to add this section**

2. **Component Updates**: Components still use old structure:
   - `t.auth.*` → Need to create auth section
   - `t.landing.*` → Should use `t.home.*` or `t.navbar.*`
   - `t.admin.*` → Should use section-specific (e.g., `t.dashboard.*`)

## 📝 Next Steps

### Immediate Actions Required:

1. **Add Auth Section**:
   ```bash
   mkdir src/messages/auth
   # Create en.json, de.json, fr.json, it.json with auth translations
   ```

2. **Add Home Section**:
   ```bash
   # Create home section with landing page translations
   # Map: landing.hero, landing.features, etc. → home.*
   ```

3. **Update ModularDictionary Type**:
   - Add `auth` property to `ModularDictionary` interface
   - Update migration helper to include auth

4. **Update Components**:
   - Search for `t.auth.*` and update to use new structure
   - Search for `t.landing.*` and update to `t.home.*` or `t.navbar.*`
   - Search for `t.admin.*` and update to section-specific paths

5. **Complete Remaining Translations**:
   - Extract remaining translations from `dictionaries.ts`
   - Create JSON files for all missing languages

6. **Final Cleanup**:
   - Remove `dictionaries.ts` once all translations are migrated
   - Remove migration helper
   - Update all component imports

## File Locations

- **Messages**: `src/messages/{section}/{lang}.json`
- **Loader**: `src/lib/i18n/loader.ts`
- **Migration**: `src/lib/i18n/migrate.ts`
- **Context**: `src/lib/i18n/context.tsx`
- **Old System**: `src/lib/i18n/dictionaries.ts` (to be removed)

## Migration Pattern

### Old → New Structure Mapping:

| Old Path | New Path |
|----------|----------|
| `t.landing.nav.*` | `t.navbar.*` |
| `t.landing.hero.*` | `t.home.hero.*` |
| `t.landing.footer.*` | `t.footer.*` |
| `t.admin.dashboard.*` | `t.dashboard.*` |
| `t.admin.menus.*` | `t.menu.*` |
| `t.admin.categories.*` | `t.menu.*` |
| `t.admin.orders.*` | `t.order.*` |
| `t.admin.analytics.*` | `t.analytics.*` |
| `t.admin.appearance.*` | `t.appearance.*` |
| `t.admin.qr.*` | `t.qr.*` |
| `t.admin.settings.*` | `t.settings.*` |
| `t.auth.*` | `t.auth.*` (new section needed) |

## Notes

- The system currently uses a migration helper that falls back to the old system
- Empty sections (table, booking) can be populated as needed
- All translations are cached for performance
- The system falls back to English if a translation is missing

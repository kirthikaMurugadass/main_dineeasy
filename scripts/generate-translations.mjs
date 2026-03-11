import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read dictionaries.ts
const dictPath = path.join(__dirname, '../src/lib/i18n/dictionaries.ts');
const content = fs.readFileSync(dictPath, 'utf-8');

// Section mappings from old structure to new
const sectionMappings = {
  navbar: { path: 'landing.nav' },
  home: { 
    paths: [
      'landing.hero',
      'landing.features', 
      'landing.demo',
      'landing.howItWorks',
      'landing.about',
      'landing.cta',
      'landing.story',
      'landing.workflow',
      'landing.ecosystem',
      'landing.trust',
      'landing.finalCta'
    ]
  },
  footer: { path: 'landing.footer' },
  dashboard: { path: 'admin.dashboard' },
  menu: { paths: ['menu', 'admin.menus', 'admin.categories'] },
  order: { path: 'admin.orders' },
  table: { path: null }, // Will be empty
  booking: { path: null }, // Will be empty
  analytics: { path: 'admin.analytics' },
  appearance: { path: 'admin.appearance' },
  qr: { path: 'admin.qr' },
  settings: { path: 'admin.settings' },
};

const languages = ['en', 'de', 'fr', 'it'];

// Extract a language object from the TS file
function extractLanguageObject(lang) {
  const regex = new RegExp(`const ${lang}: Dictionary = \\{([\\s\\S]*?)\\};`, 'm');
  const match = content.match(regex);
  if (!match) return null;
  
  // This is a simplified extraction - we'll need to manually process
  // For now, return the raw string
  return match[1];
}

// For now, we'll create a note file explaining the manual extraction needed
// Since TS parsing is complex, the best approach is to manually extract
// or use a proper TypeScript parser library

console.log('Translation extraction script');
console.log('Note: Due to TypeScript complexity, translations should be extracted manually');
console.log('or using a proper TS parser. The folder structure is ready.');

// Create a helper JSON structure file that shows what needs to be extracted
const extractionGuide = {
  note: 'This file shows the structure needed for each section',
  sections: sectionMappings,
  instructions: [
    '1. Open dictionaries.ts',
    '2. For each language (en, de, fr, it):',
    '3. Extract the relevant nested objects according to sectionMappings',
    '4. Save as JSON files in messages/{section}/{lang}.json',
    '5. Update the loader.ts to use the new structure',
    '6. Update context.tsx to use loadAllTranslations',
    '7. Update components to use new structure (e.g., t.navbar.home instead of t.landing.nav.home)',
    '8. Remove dictionaries.ts once migration is complete'
  ]
};

fs.writeFileSync(
  path.join(__dirname, '../messages/EXTRACTION_GUIDE.json'),
  JSON.stringify(extractionGuide, null, 2)
);

console.log('Created extraction guide at messages/EXTRACTION_GUIDE.json');

const fs = require('fs');
const path = require('path');

// Read the dictionaries.ts file
const dictPath = path.join(__dirname, '../src/lib/i18n/dictionaries.ts');
const content = fs.readFileSync(dictPath, 'utf-8');

// Extract the translation objects using regex
const extractObject = (lang, startMarker, endMarker) => {
  const start = content.indexOf(`${lang}: Dictionary = {`);
  if (start === -1) return null;
  
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let startPos = content.indexOf('{', start);
  let endPos = startPos;
  
  for (let i = startPos; i < content.length; i++) {
    const char = content[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' || char === "'" || char === '`') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        endPos = i + 1;
        break;
      }
    }
  }
  
  return content.substring(startPos, endPos);
};

// Simple parser to convert TS object to JSON (handles basic cases)
const tsToJson = (tsStr) => {
  // Remove comments
  tsStr = tsStr.replace(/\/\/.*$/gm, '');
  tsStr = tsStr.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Convert TypeScript object to JSON-like string
  // This is a simplified parser - handles basic cases
  let jsonStr = tsStr
    .replace(/(\w+):/g, '"$1":') // Convert keys to quoted
    .replace(/,\s*}/g, '}') // Remove trailing commas
    .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
    .replace(/\{(\w+):/g, '{"$1":'); // Handle nested objects
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Fallback: manual extraction for complex cases
    return null;
  }
};

// Section mappings
const sections = {
  navbar: 'landing.nav',
  home: ['landing.hero', 'landing.features', 'landing.demo', 'landing.howItWorks', 'landing.about', 'landing.cta', 'landing.story', 'landing.workflow', 'landing.ecosystem', 'landing.trust', 'landing.finalCta'],
  footer: 'landing.footer',
  dashboard: 'admin.dashboard',
  menu: ['menu', 'admin.menus', 'admin.categories'],
  order: 'admin.orders',
  table: {}, // Empty for now
  booking: {}, // Empty for now
  analytics: 'admin.analytics',
  appearance: 'admin.appearance',
  qr: 'admin.qr',
  settings: 'admin.settings',
};

// Languages
const languages = ['en', 'de', 'fr', 'it'];

// For now, let's create a simpler approach: manually extract based on what we know
// This script will be a helper to create the structure

console.log('Translation extraction script');
console.log('Note: This is a helper script. Manual extraction may be needed for complex nested structures.');

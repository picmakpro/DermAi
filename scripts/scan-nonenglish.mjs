// scripts/scan-nonenglish.mjs
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const ROOT = process.cwd();
const ALLOWED_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'coverage', '.git', 'public', 'locales', 'i18n']);
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

// Rough heuristic: any Latin-1 accented letter
const NON_EN_REGEX = /[À-ÖØ-öø-ÿ]/;
// Optional: common FR words you don't want in code/comments
const FR_KEYWORDS = /\b(fonction|retourne|si|sinon|alors|tant que|débog|commentaire|erreur|succès|échec)\b/i;

const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ALLOWED_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p);
    } else if (CODE_EXTS.has(extname(p))) {
      const text = readFileSync(p, 'utf8');
      // Skip files that are inside /locales or /i18n just in case
      if (p.includes('/locales/') || p.includes('/i18n/')) continue;
      if (NON_EN_REGEX.test(text) || FR_KEYWORDS.test(text)) {
        offenders.push(p);
      }
    }
  }
}

walk(ROOT);

if (offenders.length) {
  console.error('❌ Non-English content detected in code files:');
  for (const f of offenders) console.error(' -', f);
  console.error('Tip: move FR UI text to i18n resources and keep code/comments in English.');
  process.exit(1);
} else {
  console.log('✅ Language scan passed (code/comments appear English-only).');
}

import fs from 'node:fs';
import path from 'node:path';

try {
  const helpersPath = path.resolve('node_modules/@vyla-entertainment/sdk/src/utils/helpers.js');

  if (fs.existsSync(helpersPath)) {
    let content = fs.readFileSync(helpersPath, 'utf8');
    if (content.includes('setInterval(() => {\n    pruneHelperCache(tmdbValidationCache);')) {
      content = content.replace(
        /setInterval\(\(\) => \{\s*pruneHelperCache\(tmdbValidationCache\);\s*pruneHelperCache\(tmdbInfoCache\);\s*pruneHelperCache\(anilistCache\);\s*\}, 60000\)\.unref\(\);/,
        `if (typeof process !== 'undefined' && process.release?.name === 'node' && typeof process.exit === 'function') {
    try {
        setInterval(() => {
            pruneHelperCache(tmdbValidationCache);
            pruneHelperCache(tmdbInfoCache);
            pruneHelperCache(anilistCache);
        }, 60000).unref();
    } catch {}
}`
      );
      fs.writeFileSync(helpersPath, content, 'utf8');
      console.log('[patch-vyla] Successfully patched Vyla SDK for Cloudflare Workers compatibility.');
    } else {
      console.log('[patch-vyla] Vyla SDK already patched or not requiring patch.');
    }
  } else {
    console.log('[patch-vyla] Vyla SDK helpers file not found (might be installed later).');
  }
} catch (err) {
  console.warn('[patch-vyla] Notice: Patch script encountered non-fatal error:', err?.message || err);
}

// Always exit with 0 to never block Cloudflare / CI builds
process.exit(0);

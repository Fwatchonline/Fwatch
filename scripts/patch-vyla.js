import fs from 'node:fs';
import path from 'node:path';

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
  }
}

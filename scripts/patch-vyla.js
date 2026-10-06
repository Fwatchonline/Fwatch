import fs from 'node:fs';
import path from 'node:path';

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Remove any setInterval timer block in helpers.js or any other SDK module
  const intervalRegex = /setInterval\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?pruneHelperCache[\s\S]*?\}\s*,\s*\d+\s*\)(\.unref\(\))?;?/g;
  if (intervalRegex.test(content)) {
    content = content.replace(
      intervalRegex,
      '/* [Cloudflare Workers compatibility] Periodical setInterval removed; cache expiration handled lazily in cacheGet */'
    );
    modified = true;
  }

  // Also catch any bare setInterval(() => { pruneHelperCache... }, 60000)
  if (content.includes('pruneHelperCache(anilistCache);')) {
    const rawPattern = /setInterval\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?anilistCache\);\s*\}\s*,\s*60000\s*\)(\.unref\(\))?;?/;
    if (rawPattern.test(content)) {
      content = content.replace(
        rawPattern,
        '/* [Cloudflare Workers compatibility] Periodical timer removed */'
      );
      modified = true;
    }
  }

  // 2. Ensure cacheSet prunes on overflow so memory never leaks
  if (content.includes('function cacheSet(cache, key, val, ttl) { cache.set(key, { val, ts: Date.now(), ttl }); }')) {
    content = content.replace(
      'function cacheSet(cache, key, val, ttl) { cache.set(key, { val, ts: Date.now(), ttl }); }',
      'function cacheSet(cache, key, val, ttl) { if (cache.size > 3000) pruneHelperCache(cache); cache.set(key, { val, ts: Date.now(), ttl }); }'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-vyla] Successfully patched ${path.basename(filePath)} for Cloudflare Workers.`);
    return true;
  }

  return false;
}

try {
  const rootDir = process.cwd();
  const sdkDirs = [
    path.join(rootDir, 'node_modules', '@vyla-entertainment', 'sdk'),
    path.join(rootDir, '..', 'node_modules', '@vyla-entertainment', 'sdk'),
  ];

  let patchedAny = false;

  for (const sdkDir of sdkDirs) {
    if (fs.existsSync(sdkDir)) {
      const helpersFile = path.join(sdkDir, 'src', 'utils', 'helpers.js');
      if (patchFile(helpersFile)) {
        patchedAny = true;
      }

      // Also recursively check any other .js files in sdk for global setInterval
      const srcDir = path.join(sdkDir, 'src');
      if (fs.existsSync(srcDir)) {
        const findAndPatch = (dir) => {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
              findAndPatch(fullPath);
            } else if (file.endsWith('.js') && file !== 'helpers.js') {
              patchFile(fullPath);
            }
          }
        };
        findAndPatch(srcDir);
      }
    }
  }

  if (!patchedAny) {
    console.log('[patch-vyla] Vyla SDK already patched or clean.');
  }
} catch (err) {
  console.warn('[patch-vyla] Notice:', err?.message || err);
}

// Always exit 0 to never fail install/build lifecycle
process.exit(0);

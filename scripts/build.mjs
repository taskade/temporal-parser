#!/usr/bin/env node
// scripts/build.mjs
// Build script for dual CJS/ESM output with esbuild

import { build } from 'esbuild';
import { readFile, readdir, writeFile } from 'fs/promises';
import { join } from 'path';

// Plugin to rewrite .js imports to .mjs or .cjs
function rewriteImportsPlugin(extension) {
  return {
    name: 'rewrite-imports',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length > 0) return;

        const outdir = build.initialOptions.outdir;
        const files = await readdir(outdir, { recursive: true });

        for (const file of files) {
          if (!file.endsWith(extension)) continue;

          const fullPath = join(outdir, file);
          let content = await readFile(fullPath, 'utf-8');

          // Rewrite .js extensions to match output extension
          content = content.replace(/from ["'](.*)\.js["']/g, `from "$1${extension}"`);
          content = content.replace(/require\(["'](.*)\.js["']\)/g, `require("$1${extension}")`);

          await writeFile(fullPath, content, 'utf-8');
        }
      });
    },
  };
}

const sharedConfig = {
  entryPoints: ['src/index.ts'], // Single entry point that exports everything
  bundle: true, // Bundle all dependencies into single file
  sourcemap: true,
  platform: 'node',
  target: 'es2022',
  logLevel: 'info',
  external: [], // Don't mark anything as external since we're bundling
};

console.log('Building ESM format...');
// Build ESM (.mjs)
await build({
  ...sharedConfig,
  format: 'esm',
  outdir: 'dist/esm',
  outExtension: { '.js': '.mjs' },
  plugins: [rewriteImportsPlugin('.mjs')],
});

console.log('\nBuilding CJS format...');
// Build CJS (.cjs)
await build({
  ...sharedConfig,
  format: 'cjs',
  outdir: 'dist/cjs',
  outExtension: { '.js': '.cjs' },
  plugins: [rewriteImportsPlugin('.cjs')],
});

console.log('\nBuild complete! ✅');
console.log('- ESM: dist/esm/index.mjs');
console.log('- CJS: dist/cjs/index.cjs');

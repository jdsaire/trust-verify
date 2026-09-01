// vitest/config re-exports Vite's defineConfig with the `test` block typed, so one config file
// drives both the build and the test run.
import { defineConfig } from 'vitest/config';
import type { PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile } from 'node:fs/promises';
import { resolve, normalize } from 'node:path';

const API_DIR = resolve(import.meta.dirname, 'api');

/**
 * Serve api/ during development.
 *
 * In production these fixtures sit next to index.html and the host serves them directly. The dev
 * server's root is src/, so it would never see them, and every lookup would fall through to the
 * HTML page. This middleware closes that gap and — importantly — answers a missing fixture with a
 * real 404, exactly as static hosting does, so the "no such operation" path is exercised the same
 * way in dev, in tests, and in production.
 */
function apiFixtures(): PluginOption {
  return {
    name: 'api-fixtures',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        const path = (req.url ?? '/').split('?')[0] ?? '/';
        const target = resolve(API_DIR, '.' + normalize(path));
        res.setHeader('content-type', 'application/json');

        // The path segment comes off a URL; keep it inside the fixture directory.
        if (target !== API_DIR && !target.startsWith(API_DIR + '/')) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: 'forbidden' }));
          return;
        }
        try {
          res.end(await readFile(target));
        } catch {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'no such operation' }));
        }
      });
    },
  };
}

// The site root deploys the repository as-is (no build step in CI/Pages), so this sub-app's
// built output is checked in and served directly from work/yape-trust-verify/.
//
//   src/   -> source, and Vite's root (index.html entry lives here)
//   ../    -> outDir: the built index.html + assets/ land at the sub-app root
//   ../api -> the mock REST fixtures, committed where they are served from
//
// publicDir is off: outDir is the sub-app directory itself, so a public/ folder would sit inside
// its own output and every fixture would end up committed twice, free to drift apart. The
// fixtures are hand-authored static data that needs no processing, so api/ is simply their home
// and the plugin above serves them in dev.
//
// emptyOutDir is false because outDir is the project directory itself — emptying it would delete
// src/, package.json, and the rest. `npm run clean` handles stale hashed assets instead.
export default defineConfig({
  root: 'src',
  publicDir: false,
  // Relative base: the site is served from a /designops/ project path on Pages, and the
  // no-leading-slash-asset-paths invariant applies to this sub-app as it does to the rest.
  base: './',
  plugins: [react(), apiFixtures()],
  build: {
    outDir: '..',
    emptyOutDir: false,
    assetsDir: 'assets',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['../tests/setup.ts'],
    include: ['../tests/**/*.test.{ts,tsx}'],
  },
});

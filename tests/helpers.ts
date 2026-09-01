/**
 * Shared test scaffolding.
 *
 * The fixtures below are read from the same api/ directory the app is served from, so a test can
 * never pass against data the running app doesn't have.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { vi } from 'vitest';

const API_DIR = resolve(import.meta.dirname, '../api');

const readFixture = (p: string) => readFileSync(resolve(API_DIR, p), 'utf8');

const json = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'application/json' } });

/**
 * Stand in for the network with the real static host's behaviour: JSON for a fixture that exists,
 * a genuine 404 for one that doesn't.
 *
 * `delayMs` holds the ledger response open so a second tap has a window to land in — that window
 * is the whole point of the execution-lockout scenario.
 */
export function installFetchMock(opts: { delayMs?: number } = {}) {
  const calls: string[] = [];

  const impl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push(url);

    // Real fetch rejects on an aborted signal; the mock must too, or a cancellation bug would
    // pass here and only show up in a browser.
    const signal = init?.signal;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const session = /api\/session\/([\w-]+)\.json/.exec(url);
    if (session) {
      return json(readFixture(`session/${session[1]}.json`));
    }

    const match = /api\/operations\/(\d+)\.json/.exec(url);
    if (match) {
      if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs));
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      try {
        return json(readFixture(`operations/${match[1]}.json`));
      } catch {
        return json(JSON.stringify({ error: 'no such operation' }), 404);
      }
    }
    return json(JSON.stringify({ error: 'unexpected' }), 500);
  };

  const spy = vi.fn(impl);
  vi.stubGlobal('fetch', spy);

  return {
    calls,
    /** How many times the ledger itself was hit — the number the lockout test asserts on. */
    ledgerCalls: () => calls.filter((u) => u.includes('api/operations/')).length,
  };
}

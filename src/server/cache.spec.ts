import type { NextFunction, Request, Response } from 'express';
import type { AngularNodeAppEngine } from '@angular/ssr/node';
import { createSsrCache } from './cache';

interface FakeRender {
  status?: number;
  html?: string;
  headers?: [string, string][];
}

interface Sent {
  status: number;
  body: string;
  headers: Record<string, string>;
  cache: string;
}

const HOST = 'journal.nordicuniversity.org';

function fakeResponse({ status = 200, html = '<html></html>', headers = [['content-type', 'text/html; charset=utf-8']] }: FakeRender = {}) {
  return { status, text: async () => html, headers: new Map(headers.map(([k, v]) => [k, v] as const)) };
}

function setup(render: (req: Request) => FakeRender | Promise<FakeRender>, options: Parameters<typeof createSsrCache>[1] = {}) {
  const handle = vi.fn(async (req: Request) => fakeResponse(await render(req)));
  const cache = createSsrCache({ handle } as unknown as AngularNodeAppEngine, { allowedHosts: [HOST], ...options });

  function request(url: string, headers: Record<string, string> = {}): Promise<Sent | 'next'> {
    return new Promise((resolve, reject) => {
      const sent: Sent = { status: 0, body: '', headers: {}, cache: '' };
      const res = {
        status(code: number) { sent.status = code; return res; },
        setHeader(name: string, value: string) { sent.headers[name.toLowerCase()] = value; },
        send(body: string) {
          sent.body = body;
          sent.cache = sent.headers['x-ssr-cache'];
          resolve(sent);
        },
      };
      const req = { originalUrl: url, url, headers: { host: HOST, ...headers } } as unknown as Request;
      const next: NextFunction = (err?: unknown) => (err ? reject(err) : resolve('next'));
      cache.handler(req, res as unknown as Response, next);
    });
  }

  return { handle, cache, request };
}

const sent = (r: Sent | 'next') => r as Sent;

describe('createSsrCache', () => {
  it('caches 200 text/html renders (MISS then HIT) with private no-cache headers', async () => {
    const { handle, request } = setup(() => ({ html: '<p>home</p>' }));
    const first = sent(await request('/'));
    const second = sent(await request('/'));
    expect(first.cache).toBe('MISS');
    expect(second.cache).toBe('HIT');
    expect(second.body).toBe('<p>home</p>');
    expect(second.headers['cache-control']).toBe('private, no-cache');
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it.each([404, 500, 301])('never caches a %i response', async (status) => {
    const { handle, request } = setup(() => ({ status, html: 'nope' }));
    const first = sent(await request('/missing'));
    const second = sent(await request('/missing'));
    expect(first.status).toBe(status);
    expect(second.cache).toBe('MISS');
    expect(handle).toHaveBeenCalledTimes(2);
  });

  it('never caches responses that set cookies or are not HTML', async () => {
    const { handle, request } = setup((req) =>
      req.url === '/cookie'
        ? { headers: [['content-type', 'text/html'], ['set-cookie', 'a=1']] }
        : { headers: [['content-type', 'application/json']] },
    );
    await request('/cookie');
    await request('/cookie');
    await request('/json');
    await request('/json');
    expect(handle).toHaveBeenCalledTimes(4);
  });

  it('bypasses the cache (no read, no write) for an untrusted X-Forwarded-Host', async () => {
    const { handle, request } = setup((req) => ({ html: `rendered for ${req.headers['x-forwarded-host'] ?? 'trusted'}` }));

    // Untrusted request first: must not populate the cache
    const evil1 = sent(await request('/', { 'x-forwarded-host': 'evil.example.com' }));
    expect(evil1.cache).toBe('BYPASS');

    const trusted = sent(await request('/'));
    expect(trusted.cache).toBe('MISS');
    expect(trusted.body).toBe('rendered for trusted');

    // Untrusted request after priming: must not read the cached entry either
    const evil2 = sent(await request('/', { 'x-forwarded-host': 'evil.example.com' }));
    expect(evil2.cache).toBe('BYPASS');

    // Look-alike host (suffix attack) is untrusted too
    const lookAlike = sent(await request('/', { 'x-forwarded-host': `${HOST}.attacker.com` }));
    expect(lookAlike.cache).toBe('BYPASS');

    expect(sent(await request('/')).body).toBe('rendered for trusted');
    expect(handle).toHaveBeenCalledTimes(4);
  });

  it('accepts the configured host in X-Forwarded-Host (incl. port)', async () => {
    const { request } = setup(() => ({}));
    await request('/', { 'x-forwarded-host': `${HOST}:443` });
    expect(sent(await request('/', { 'x-forwarded-host': HOST })).cache).toBe('HIT');
  });

  it('evicts the least recently used entry when full', async () => {
    const { handle, request } = setup((req) => ({ html: req.url }), { maxSize: 2 });
    await request('/a');
    await request('/b');
    expect(sent(await request('/a')).cache).toBe('HIT'); // /a is now most recently used
    await request('/c'); // evicts /b
    expect(sent(await request('/a')).cache).toBe('HIT');
    expect(sent(await request('/c')).cache).toBe('HIT');
    expect(sent(await request('/b')).cache).toBe('MISS');
    expect(handle).toHaveBeenCalledTimes(4);
  });

  it('dedupes concurrent renders of the same key', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { handle, request } = setup(async () => {
      await gate;
      return { html: 'once' };
    });
    const pending = [request('/x'), request('/x'), request('/x')];
    await Promise.resolve();
    release();
    const results = (await Promise.all(pending)).map(sent);
    expect(handle).toHaveBeenCalledTimes(1);
    expect(results.map((r) => r.body)).toEqual(['once', 'once', 'once']);
  });

  it('keys by language and login cookies, and honours skipPaths', async () => {
    const { handle, request } = setup(() => ({}), { skipPaths: ['/cabinet'] });
    await request('/', { cookie: 'lang=ru' });
    expect(sent(await request('/', { cookie: 'lang=uz' })).cache).toBe('MISS');
    expect(sent(await request('/', { cookie: 'lang=ru' })).cache).toBe('HIT');
    expect(sent(await request('/', { cookie: 'lang=ru; logged_in=1' })).cache).toBe('MISS');
    expect(sent(await request('/cabinet/profile')).cache).toBe('BYPASS');
    expect(sent(await request('/cabinet/profile')).cache).toBe('BYPASS');
    expect(handle).toHaveBeenCalledTimes(5);
  });

  it('invalidate() empties the cache', async () => {
    const { cache, request } = setup(() => ({}));
    await request('/');
    expect(cache.invalidate()).toBe(1);
    expect(sent(await request('/')).cache).toBe('MISS');
  });
});

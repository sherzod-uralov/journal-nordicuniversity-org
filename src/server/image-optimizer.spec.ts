import type { Express, Request, Response } from 'express';
import { registerImageOptimizer } from './image-optimizer';

const API = 'https://journal2.nordicun.uz';

type Handler = (req: Request, res: Response) => Promise<void>;

function setup() {
  let handler!: Handler;
  const app = { get: (path: string, h: Handler) => { if (path === '/_img') handler = h; } };
  registerImageOptimizer(app as unknown as Express, API);

  return async (query: Record<string, string | undefined>) => {
    const out = { status: 200, body: undefined as unknown };
    const res = {
      status(code: number) { out.status = code; return res; },
      setHeader: vi.fn(),
      send(body: unknown) { out.body = body; },
    };
    await handler({ query } as unknown as Request, res as unknown as Response);
    return out;
  };
}

describe('image optimizer URL validation', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Upstream 404 → the handler answers 404 without ever reaching sharp.
    fetchMock = vi.fn(async () => ({ ok: false, status: 404, body: null }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('rejects a missing url with 400', async () => {
    const request = setup();
    expect((await request({})).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'https://journal2.nordicun.uz.attacker.com/x',
    'https://journal2.nordicun.uz:6379/x',
    'http://journal2.nordicun.uz:6379/',
    'http://journal2.nordicun.uz/x',
    'https://user:pass@journal2.nordicun.uz/x',
    'https://evil.com/?u=https://journal2.nordicun.uz/x',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'http://127.0.0.1:6379/',
  ])('rejects %s with 403 and never fetches it', async (url) => {
    const request = setup();
    const res = await request({ url });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['https://journal2.nordicun.uz/uploads/a.png', 'https://journal2.nordicun.uz/uploads/a.png'],
    ['/uploads/a.png', 'https://journal2.nordicun.uz/uploads/a.png'],
    ['uploads/a.png', 'https://journal2.nordicun.uz/uploads/a.png'],
    ['//evil.com/a.png', 'https://journal2.nordicun.uz/evil.com/a.png'],
  ])('accepts same-origin %s (fetches %s)', async (url, expected) => {
    const request = setup();
    const res = await request({ url, w: '300' });
    expect(res.status).not.toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(expected);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
  });

  it('maps upstream failures to 404 / 502 without leaking the upstream status', async () => {
    const request = setup();
    expect((await request({ url: '/missing.png' })).status).toBe(404);
    fetchMock.mockImplementationOnce(async () => ({ ok: false, status: 401, body: null }));
    expect((await request({ url: '/private.png' })).status).toBe(502);
    fetchMock.mockImplementationOnce(async () => { throw new TypeError('network'); });
    expect((await request({ url: '/down.png' })).status).toBe(502);
  });
});

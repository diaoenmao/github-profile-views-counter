const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/views');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.code = code; return this; }, end(body) { this.body = body; return this; } };
}
function svgResponse() {
  return { ok: true, headers: new Headers({ 'content-type': 'image/svg+xml' }),
    text: async () => '<svg xmlns="http://www.w3.org/2000/svg"><text>6651</text></svg>' };
}
test('GitHub image requests reach the same existing counter without a migration offset', async () => {
  global.fetch = async (url, options) => {
    const query = new URL(url).searchParams;
    assert.equal(query.get('username'), 'diaoenmao');
    assert.equal(query.has('base'), false);
    assert.equal(options.headers['User-Agent'], 'github-camo test');
    return svgResponse();
  };
  const res = response();
  await handler({ method: 'GET', headers: { 'user-agent': 'github-camo test' } }, res);
  assert.equal(res.code, 200);
  assert.match(res.body, /6651/);
  assert.match(res.headers['Cache-Control'], /no-store/);
});
test('ordinary local previews do not pretend to be a GitHub hit', async () => {
  global.fetch = async (_, options) => {
    assert.equal(options.headers['User-Agent'], 'diaoenmao-profile-preview');
    return svgResponse();
  };
  const res = response();
  await handler({ method: 'GET', headers: { 'user-agent': 'Mozilla/5.0' } }, res);
  assert.equal(res.code, 200);
});
test('HEAD reads without forwarding an incrementing user agent or a body', async () => {
  global.fetch = async (_, options) => {
    assert.equal(options.method, 'HEAD');
    assert.equal(options.headers['User-Agent'], 'diaoenmao-profile-preview');
    return svgResponse();
  };
  const res = response();
  await handler({ method: 'HEAD', headers: { 'user-agent': 'github-camo test' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body, '');
});
test('unsupported methods cannot reach the upstream', async () => {
  global.fetch = () => assert.fail('No upstream request expected');
  const res = response();
  await handler({ method: 'POST' }, res);
  assert.equal(res.code, 405);
});
test('upstream outages and non-SVG responses produce unavailable rather than a fabricated total', async () => {
  for (const mock of [async () => { throw new Error('down'); }, async () => ({ ok: true, headers: new Headers({ 'content-type': 'text/html' }) })]) {
    global.fetch = mock;
    const res = response();
    await handler({ method: 'GET' }, res);
    assert.equal(res.code, 503);
    assert.match(res.body, /Profile views: --/);
    assert.doesNotMatch(res.body, /6651/);
  }
});

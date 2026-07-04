const base = process.env.BASE_URL || 'http://localhost:3001';
const brokerEmail = process.env.SMOKE_BROKER_EMAIL || 'corredor@neife.cl';
const brokerPassword = process.env.SMOKE_BROKER_PASSWORD || 'demo1234';
const cookieJar = new Map();

const buildHeaders = (headers = {}) => {
  const cookie = Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return cookie ? { ...headers, Cookie: cookie } : headers;
};

const parseSetCookieHeader = (raw) => {
  const cookies = [];
  let current = '';
  let inExpires = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1] ?? '';
    current += char;

    if (raw.slice(i - 7, i + 1).toLowerCase() === 'expires=') {
      inExpires = true;
    }

    if (inExpires && char === ';') {
      inExpires = false;
    }

    if (char === ',' && next === ' ' && !inExpires) {
      cookies.push(current.slice(0, -1).trim());
      current = '';
      i += 1;
    }
  }

  if (current.trim()) {
    cookies.push(current.trim());
  }

  return cookies;
};

const saveCookies = (res) => {
  const raw = res.headers.get('set-cookie');
  if (raw) console.log('[saveCookies] raw set-cookie header:', raw);
  if (!raw) return;
  const headers = parseSetCookieHeader(raw);
  headers.forEach((header) => {
    const [pair] = header.split(';');
    const [name, value] = pair.split('=');
    if (name && value) cookieJar.set(name.trim(), value.trim());
  });
};

const getJson = async (url, options = {}) => {
  const res = await fetch(url, { ...options, headers: buildHeaders(options.headers) });
  saveCookies(res);
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text) } catch {}
  return { res, body };
};

const run = async () => {
  console.log('Starting concurrent CRM smoke test against', base);

  const csrfResult = await getJson(`${base}/api/auth/csrf`, { headers: { Accept: 'application/json' } });
  if (csrfResult.res.status !== 200) { console.error('CSRF failed', csrfResult.body); process.exit(1); }
  const csrfToken = csrfResult.body.csrfToken;
  if (!csrfToken) throw new Error('Missing csrfToken');

  const loginParams = new URLSearchParams();
  loginParams.append('csrfToken', csrfToken);
  loginParams.append('email', brokerEmail);
  loginParams.append('password', brokerPassword);
  loginParams.append('callbackUrl', `${base}/`);

  const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: 'POST', headers: buildHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }), body: loginParams, redirect: 'manual'
  });
  saveCookies(loginRes);
  if (loginRes.status !== 302) { console.error('Login failed', await loginRes.text()); process.exit(1); }

  const n = Number(process.env.CONCURRENT || 8);
  console.log('Creating', n, 'deals in parallel');
  const payload = { title: 'Smoke Parallel Deal', operationType: 'ARRIENDO', notes: 'Concurrent smoke' };

  const promises = Array.from({ length: n }).map(() => fetch(`${base}/api/crm/deals`, {
    method: 'POST', headers: buildHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(payload)
  }).then(async (res) => ({ status: res.status, body: await res.text() })).catch((err) => ({ error: String(err) })));

  const results = await Promise.all(promises);
  results.forEach((r, i) => console.log('Result', i, r));

  const failures = results.filter(r => r.status !== 201);
  if (failures.length) {
    console.error('Some creations failed:', failures.length);
    process.exit(1);
  }

  console.log('Concurrent creation completed successfully');
};

run().catch((e) => { console.error('Smoke concurrent failed', e); process.exit(1); });

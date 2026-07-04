const base = process.env.BASE_URL || 'http://localhost:3001';
const brokerEmail = process.env.SMOKE_BROKER_EMAIL || 'corredor@neife.cl';
const brokerPassword = process.env.SMOKE_BROKER_PASSWORD || 'demo1234';

const jar = new Map();
const buildHeaders = (headers = {}) => {
  const cookie = Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
  return cookie ? { ...headers, Cookie: cookie } : headers;
};

const parseSetCookieHeader = (raw) => {
  if (!raw) return [];
  const cookies = [];
  let current = '';
  let inExpires = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1] || '';
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

  if (current.trim()) cookies.push(current.trim());
  return cookies;
};

const saveCookies = (res) => {
  const raw = res.headers.get('set-cookie');
  if (!raw) return;
  for (const header of parseSetCookieHeader(raw)) {
    const [pair] = header.split(';');
    const [name, value] = pair.split('=');
    if (name && value) jar.set(name.trim(), value.trim());
  }
};

const request = async (url, options = {}) => {
  const res = await fetch(url, { ...options, headers: buildHeaders(options.headers) });
  saveCookies(res);
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch (err) {
    // not JSON
  }
  return { res, body };
};

(async () => {
  console.log('Verifying dev server at', base);

  const csrf = await request(`${base}/api/auth/csrf`, { headers: { Accept: 'application/json' } });
  console.log('csrf status', csrf.res.status);
  if (csrf.res.status !== 200) return process.exit(1);

  const csrfToken = csrf.body?.csrfToken;
  if (!csrfToken) {
    console.error('Missing csrfToken');
    return process.exit(1);
  }

  const loginParams = new URLSearchParams();
  loginParams.append('csrfToken', csrfToken);
  loginParams.append('email', brokerEmail);
  loginParams.append('password', brokerPassword);
  loginParams.append('callbackUrl', `${base}/`);

  const login = await fetch(`${base}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: loginParams,
    redirect: 'manual',
  });
  saveCookies(login);
  console.log('login status', login.status, 'location', login.headers.get('location'));
  if (![302, 303].includes(login.status)) {
    const text = await login.text();
    console.error('Login failed body:', text);
    return process.exit(1);
  }

  const me = await request(`${base}/api/users/me`, { headers: { Accept: 'application/json' } });
  console.log('me status', me.res.status, 'user keys', me.body && Object.keys(me.body));
  if (me.res.status !== 200) return process.exit(1);

  const pipeline = await request(`${base}/api/crm/planning/pipeline`, { headers: { Accept: 'application/json' } });
  console.log('pipeline status', pipeline.res.status);
  if (pipeline.res.status === 200) {
    console.log('pipeline rows', Array.isArray(pipeline.body.rows) ? pipeline.body.rows.length : 'unknown');
    console.log('pipeline sample', JSON.stringify(pipeline.body.rows?.slice(0, 3), null, 2));
  } else {
    console.error('pipeline error', pipeline.body);
  }

  const strategies = await request(`${base}/api/crm/strategies`, { headers: { Accept: 'application/json' } });
  console.log('strategies status', strategies.res.status);
  if (strategies.res.status === 200) {
    console.log('strategies count', Array.isArray(strategies.body.strategies) ? strategies.body.strategies.length : 'unknown');
    console.log('strategies sample', JSON.stringify(strategies.body.strategies?.slice(0, 3), null, 2));
  } else {
    console.error('strategies error', strategies.body);
  }

  const page = await request(`${base}/broker/crm/goals`, { headers: { Accept: 'text/html' } });
  console.log('goals page status', page.res.status);
  console.log('goals page title exists?', typeof page.body === 'string' && page.body.includes('<title'));
  console.log('goals page contains tab labels:', page.body.includes('Pipeline'), page.body.includes('Estrategias'));
})().catch((err) => {
  console.error('VERIFY ERROR', err);
  process.exit(1);
});

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
  try { body = JSON.parse(text); } catch (err) {}
  return { res, body };
};

(async () => {
  try {
    console.log('CRM smoke test target', base);

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
    console.log('login status', login.status);
    if (![302,303].includes(login.status)) {
      const text = await login.text();
      console.error('Login failed body:', text);
      return process.exit(1);
    }

    const qa = await request(`${base}/api/broker/quick-actions`, { headers: { Accept: 'application/json' } });
    console.log('quick-actions', qa.res.status);
    if (qa.res.status !== 200) {
      console.error('quick-actions body', qa.body);
      return process.exit(2);
    }

    const tasks = await request(`${base}/api/crm/tasks`, { headers: { Accept: 'application/json' } });
    console.log('tasks', tasks.res.status);
    if (tasks.res.status !== 200) {
      console.error('tasks body', tasks.body);
      return process.exit(2);
    }

    console.log('CRM smoke tests passed');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test error', err);
    process.exit(1);
  }
})()

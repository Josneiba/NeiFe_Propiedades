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
  if (!raw) return;
  const headers = parseSetCookieHeader(raw);
  headers.forEach((header) => {
    const [pair] = header.split(';');
    const [name, value] = pair.split('=');
    if (name && value) {
      cookieJar.set(name.trim(), value.trim());
    }
  });
};

const getJson = async (url, options = {}) => {
  const res = await fetch(url, { ...options, headers: buildHeaders(options.headers) });
  saveCookies(res);
  const text = await res.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // ignore parse error
  }
  return { res, body };
};

const run = async () => {
  console.log('Starting CRM smoke test against', base);

  const csrfResult = await getJson(`${base}/api/auth/csrf`, {
    headers: { Accept: 'application/json' },
  });
  if (csrfResult.res.status !== 200) {
    console.error('CSRF failed', csrfResult.body);
    process.exit(1);
  }

  const csrfToken = csrfResult.body.csrfToken;
  if (!csrfToken) {
    throw new Error('Missing csrfToken');
  }

  const loginParams = new URLSearchParams();
  loginParams.append('csrfToken', csrfToken);
  loginParams.append('email', brokerEmail);
  loginParams.append('password', brokerPassword);
  loginParams.append('callbackUrl', `${base}/`);

  const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
    body: loginParams,
    redirect: 'manual',
  });
  saveCookies(loginRes);
  if (loginRes.status !== 302) {
    console.error('Login failed', await loginRes.text());
    process.exit(1);
  }

  const meResult = await getJson(`${base}/api/users/me`, {
    headers: { Accept: 'application/json' },
  });
  if (meResult.res.status !== 200) {
    console.error('Authenticated user check failed', meResult.body);
    process.exit(1);
  }

  const dealPayload = {
    title: 'Smoke Test Deal',
    operationType: 'ARRIENDO',
    notes: 'Smoke test from automation',
  };
  const dealResult = await getJson(`${base}/api/crm/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dealPayload),
  });
  if (dealResult.res.status !== 201) {
    console.error('Deal creation failed', dealResult.body);
    process.exit(1);
  }

  const dealId = dealResult.body.id;
  if (!dealId) {
    throw new Error('Deal ID missing');
  }

  const instanceResult = await getJson(`${base}/api/crm/workflow-instances/by-deal/${dealId}`, {
    headers: { Accept: 'application/json' },
  });
  if (!instanceResult.body.found) {
    console.error('Workflow instance not found');
    process.exit(1);
  }

  const instanceId = instanceResult.body.instance.id;
  const firstStage = instanceResult.body.instance.stages?.[0];
  if (!firstStage) {
    throw new Error('No workflow stage available');
  }

  const completeResult = await getJson(`${base}/api/crm/workflow-instances/${instanceId}/stages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stageId: firstStage.id }),
  });
  if (completeResult.res.status !== 200 || completeResult.body.ok !== true) {
    console.error('Stage completion failed', completeResult.body);
    process.exit(1);
  }

  console.log('Smoke test completed successfully');
};

run().catch((error) => {
  console.error('Smoke test failed', error);
  process.exit(1);
});

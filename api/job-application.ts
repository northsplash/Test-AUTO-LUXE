export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const POSITIONS = new Set(['detailer', 'd2d_agent', 'manager']);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

function env(name: string) {
  return String(process.env[name] || '').trim();
}

function supabaseUrl() {
  return env('VITE_SUPABASE_URL') || env('SUPABASE_URL');
}

function anonKey() {
  return env('VITE_SUPABASE_ANON_KEY') || env('SUPABASE_ANON_KEY');
}

function serviceKey() {
  return env('SUPABASE_SERVICE_ROLE_KEY');
}

function messageOf(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';
  const row = payload as Record<string, unknown>;
  if (typeof row.error === 'string') return row.error;
  if (typeof row.message === 'string') return row.message;
  if (typeof row.msg === 'string') return row.msg;
  if (Array.isArray(payload) && payload[0] && typeof payload[0] === 'object') {
    const first = payload[0] as Record<string, unknown>;
    return String(first.message || first.hint || first.error || '');
  }
  return '';
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, payload };
}

function savedId(payload: unknown) {
  if (!payload || typeof payload !== 'object') return '';
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row !== 'object') return '';
  const id = (row as Record<string, unknown>).id;
  return id != null ? String(id) : '';
}

async function deliverApplicationByEmail(fields: {
  full_name: string; email: string; phone: string; role: string;
  city: string; start_when: string; availability: string; notes: string;
}) {
  const res = await fetch('https://formsubmit.co/ajax/Admin@northsplash.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      Origin: 'https://www.northsplash.com',
      Referer: 'https://www.northsplash.com/apply',
    },
    body: JSON.stringify({
      _subject: `North Splash job application: ${fields.full_name} (${fields.role})`,
      _template: 'table',
      _captcha: 'false',
      _replyto: fields.email,
      name: fields.full_name,
      email: fields.email,
      phone: fields.phone,
      role: fields.role,
      city: fields.city,
      start_when: fields.start_when,
      availability: fields.availability,
      message: fields.notes,
    }),
  });
  const text = await res.text();
  const blob = text.toLowerCase();
  return res.ok && /activation|actived|activated|success":"true"|success":true/.test(blob);
}

async function deliverApplicationToHiringBoard(
  url: string,
  anon: string,
  app: {
    full_name: string;
    email: string;
    phone: string;
    position: string;
    city: string;
    availability: string;
    start_when: string;
    notes: string;
  },
) {
  const osBoard = await postJson('https://ns-auto-luxe-os.vercel.app/api/website-apply', {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }, app);
  if (osBoard.ok && savedId(osBoard.payload)) return savedId(osBoard.payload);

  const botEmail = env('WEBSITE_APPLY_EMAIL');
  const botPassword = env('WEBSITE_APPLY_PASSWORD');
  let access = '';
  let userId = '';
  if (botEmail && botPassword) {
    const login = await postJson(`${url}/auth/v1/token?grant_type=password`, {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    }, { email: botEmail, password: botPassword });
    const row = login.payload as { access_token?: string; user?: { id?: string } };
    access = String(row.access_token || '');
    userId = String(row.user?.id || '');
  }
  if (!access || !userId) return '';

  const insert = await fetch(`${url}/rest/v1/appointments`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      service_name: 'Website job application',
      package_name: 'website-apply',
      status: 'pending',
      price: 0,
      archived: true,
      customer_name: app.full_name,
      customer_email: app.email,
      customer_phone: app.phone,
      source_channel: 'website_apply',
      notes: JSON.stringify({
        kind: 'website_job_application',
        full_name: app.full_name,
        email: app.email,
        phone: app.phone,
        position: app.position,
        city: app.city,
        availability: app.availability,
        start_when: app.start_when,
        notes: app.notes,
      }),
    }),
  });
  const saved = await insert.json().catch(() => null);
  return savedId(saved);
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const url = supabaseUrl();
    const service = serviceKey();
    const anon = anonKey();
    const restKey = service || anon;
    if (!url || !anon) throw new Error('Hiring is not connected on this site yet.');

    const body = await req.json();
    if (String(body.company_website || '').trim()) return json({ success: true, id: 'ignored' });

    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').replace(/\D/g, '');
    const position = String(body.position || '').trim();
    const city = String(body.city || '').trim();
    const availability = String(body.availability || '').trim();
    const why = String(body.why || '').trim();
    const experienceDetail = String(body.experience_detail || '').trim();
    const startWhen = String(body.start_when || '').trim();
    const years = Number(body.years_experience);
    const authorized = Boolean(body.authorized_to_work);
    const transportation = Boolean(body.transportation);
    const weekends = Boolean(body.weekends);
    const hasLicense = Boolean(body.has_license);
    const fieldRole = position === 'detailer' || position === 'd2d_agent';

    if (fullName.length < 2) throw new Error('Enter your full name.');
    if (!email.includes('@')) throw new Error('Enter a valid email.');
    if (phone.length < 10) throw new Error('Enter a 10-digit phone number.');
    if (new Set(phone).size === 1) throw new Error('Enter a real phone number.');
    if (!POSITIONS.has(position)) throw new Error('Choose a role.');
    if (city.length < 2) throw new Error('Enter the North Carolina city you work from.');
    if (!startWhen) throw new Error('Tell us the earliest day you can start.');
    if (experienceDetail.length < 20) throw new Error('Tell us about your related experience in a couple of sentences.');
    if (fieldRole && !hasLicense) throw new Error('Field roles need a valid driver’s license.');
    if (!authorized) throw new Error('Confirm you are authorized to work in the United States.');
    if (why.length < 20) throw new Error('Tell us a little more about why you want this role.');

    const application = {
      ...body,
      full_name: fullName,
      email,
      phone,
      position,
      city,
      availability,
      why,
      experience_detail: experienceDetail,
      start_when: startWhen,
      years_experience: Number.isFinite(years) ? years : 0,
      authorized_to_work: authorized,
      transportation,
      weekends,
      has_license: hasLicense,
    };

    const fn = await postJson(`${url}/functions/v1/submit-job-application`, {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    }, application);
    if (fn.ok && savedId(fn.payload)) {
      return json({ success: true, id: savedId(fn.payload), duplicate: Boolean((fn.payload as { duplicate?: boolean }).duplicate) });
    }

    const rpc = await postJson(`${url}/rest/v1/rpc/submit_website_job_application`, {
      apikey: restKey,
      Authorization: `Bearer ${restKey}`,
      'Content-Type': 'application/json',
    }, { payload: application });
    if (rpc.ok && savedId(rpc.payload)) {
      return json({ success: true, id: savedId(rpc.payload), duplicate: Boolean((rpc.payload as { duplicate?: boolean }).duplicate) });
    }

    const notes = [
      'Website application',
      `City: ${city}, NC`,
      startWhen ? `Earliest start: ${startWhen}` : '',
      availability ? `Availability: ${availability}${weekends ? '; some weekends' : ''}` : '',
      Number.isFinite(years) ? `Related experience: ${years} year${years === 1 ? '' : 's'}` : '',
      `Driver’s license: ${hasLicense ? 'Yes' : fieldRole ? 'No / not confirmed' : 'Not required for this seat'}`,
      `Authorized to work in the U.S.: ${authorized ? 'Yes' : 'No'}`,
      `Reliable transportation: ${transportation ? 'Yes' : 'No'}`,
      experienceDetail ? `Experience in their words:\n${experienceDetail}` : '',
      why ? `Why this role:\n${why}` : '',
    ].filter(Boolean).join('\n');

    const row = {
      full_name: fullName,
      email,
      phone,
      position,
      stage: 'applied',
      source: 'Website',
      background_status: 'not_started',
      desired_schedule: [availability, startWhen ? `start ${startWhen}` : ''].filter(Boolean).join(' · ') || null,
      city,
      years_experience: Number.isFinite(years) ? years : null,
      authorized_to_work: authorized,
      notes,
    };

    const headers = {
      apikey: restKey,
      Authorization: `Bearer ${restKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };
    const insert = await postJson(`${url}/rest/v1/recruiting_candidates`, headers, row);
    if (insert.ok && (savedId(insert.payload) || insert.status === 201)) {
      return json({ success: true, id: savedId(insert.payload) || 'ok', duplicate: false });
    }

    const slim = {
      full_name: fullName,
      email,
      phone,
      position,
      stage: 'applied',
      source: 'Website',
      background_status: 'not_started',
      desired_schedule: [availability, startWhen ? `start ${startWhen}` : ''].filter(Boolean).join(' · ') || null,
      notes,
    };
    const retry = await postJson(`${url}/rest/v1/recruiting_candidates`, headers, slim);
    if (retry.ok) {
      return json({ success: true, id: savedId(retry.payload) || 'ok', duplicate: false });
    }

    const ignorable = /not find the function|schema cache|not found|requested function was not found/i
    const restMessage = messageOf(retry.payload) || messageOf(insert.payload)
    const rpcMessage = messageOf(rpc.payload)
    const fnMessage = messageOf(fn.payload)

    const board = await deliverApplicationToHiringBoard(url, anon, {
      ...application,
      notes,
    });
    if (board) return json({ success: true, id: board, duplicate: false });

    const mailed = await deliverApplicationByEmail({
      full_name: fullName,
      email,
      phone,
      role: position === 'd2d_agent' ? 'Door-to-door Sales' : position === 'manager' ? 'Operations / Concierge' : 'Mobile Detailer',
      city: `${city}, NC`,
      start_when: startWhen,
      availability: `${availability}${weekends ? '; some weekends' : ''}`,
      notes,
    });
    if (mailed) return json({ success: true, id: 'email', duplicate: false });

    const message = [restMessage, rpcMessage, fnMessage].find((m) => m && !ignorable.test(m))
      || restMessage
      || 'The hiring board could not take this application.'
    throw new Error(message);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
}

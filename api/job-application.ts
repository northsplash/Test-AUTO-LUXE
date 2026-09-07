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
    const message = [restMessage, rpcMessage, fnMessage].find((m) => m && !ignorable.test(m))
      || restMessage
      || 'The hiring board could not take this application.'
    throw new Error(message);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
}

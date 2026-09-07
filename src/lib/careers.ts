import { createClient } from '@supabase/supabase-js';

export type OpenRole = {
  id: 'detailer' | 'd2d_agent' | 'manager';
  title: string;
  pay: string;
  summary: string;
  duties: string[];
  fits: string[];
  fieldRole: boolean;
  experiencePrompt: string;
  experiencePlaceholder: string;
  whyPrompt: string;
  whyPlaceholder: string;
};

export const OPEN_ROLES: OpenRole[] = [
  {
    id: 'detailer',
    title: 'Mobile Detailer',
    pay: 'Hourly by level · tips on top · typically $25–$45+ on a full book',
    summary:
      'You are the visit. Drive to homes and offices across North Carolina, photograph the vehicle, run the booked package, and leave the owner with a clean car and a walk-around they can trust.',
    duties: [
      'Complete a 2–4 hour on-site appointment with the process we train',
      'Photograph before and after, note paint and interior condition, and flag extra work before you start',
      'Keep the van stocked, the driveway tidy, and the customer updated if timing slips',
    ],
    fits: [
      'Valid driver’s license and a clean driving record',
      'Comfortable on your feet, in heat, and around water, polish, and chemicals',
      'Detailing experience helps; we will train the North Splash process if you take coaching well',
    ],
    fieldRole: true,
    experiencePrompt: 'What vehicles and packages have you actually detailed?',
    experiencePlaceholder:
      'Example: two years in a shop doing washes and interiors; ceramic spray on daily drivers; I have not done paint correction yet.',
    whyPrompt: 'Why mobile detailing with North Splash?',
    whyPlaceholder:
      'Tell us why driveway work fits you — mornings, weekends, travel, or the kind of finish you care about.',
  },
  {
    id: 'd2d_agent',
    title: 'Door-to-door Sales',
    pay: 'Weekly base plus commission · $400–$1,200+ weeks when you stay consistent',
    summary:
      'You knock neighborhoods we already map, book mobile details, and turn a five-minute porch conversation into a paid appointment. This is field sales, not a call-center seat.',
    duties: [
      'Work an assigned neighborhood with a script, a phone or tablet, and same-day follow-up',
      'Qualify the vehicle, the driveway, and the owner’s timing before you promise a slot',
      'Hand off a clean booking so a detailer can run the job without chasing you',
    ],
    fits: [
      'Valid driver’s license — you will drive between neighborhoods',
      'Thick skin, a clear voice, and no problem knocking in daylight hours',
      'Prior door-to-door, canvassing, or commission sales is a plus, not a requirement',
    ],
    fieldRole: true,
    experiencePrompt: 'What have you sold face-to-face, and how did a typical week actually go?',
    experiencePlaceholder:
      'Example: solar or pest control last summer, about 30 doors a day, booked 8–12 jobs a week. Or: I have not done door-to-door, but I have retail closing experience.',
    whyPrompt: 'Why door-to-door for North Splash?',
    whyPlaceholder:
      'Why knocking doors, and what kind of neighborhood or schedule do you want to work?',
  },
  {
    id: 'manager',
    title: 'Operations / Concierge',
    pay: 'Hourly plus performance · typically $18–$28 / hour to start',
    summary:
      'You sit at the desk that keeps North Carolina booked. Answer the phone, confirm tomorrow’s routes, handle deposits and weather calls, and make sure the van and the customer show up at the same address.',
    duties: [
      'Answer 330-990-3956 and the website inbox with real times, not placeholders',
      'Build daily routes, confirm deposits, and text customers when a slot moves',
      'Keep the hiring and booking boards accurate so owners are not hunting for the truth',
    ],
    fits: [
      'Calm on the phone when someone is late, wet, or unhappy',
      'Comfortable with calendars, texts, and a browser — we will train the portal',
      'Dispatch, salon, shop, or customer-service experience helps',
    ],
    fieldRole: false,
    experiencePrompt: 'Where have you run a calendar, a phone line, or a customer queue?',
    experiencePlaceholder:
      'Example: front desk at a shop; dispatch for a contractor; I have not done this, but I keep a household of four on a shared calendar.',
    whyPrompt: 'Why the concierge desk?',
    whyPlaceholder:
      'Why the desk instead of the driveway, and what hours can you actually cover?',
  },
];

export type RoleId = OpenRole['id'];

export type JobApplication = {
  position: RoleId;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  years_experience: string;
  experience_detail: string;
  availability: string;
  start_when: string;
  weekends: boolean;
  transportation: boolean;
  has_license: boolean;
  authorized_to_work: boolean;
  why: string;
  company_website: string;
};

export const emptyApplication = (position: RoleId = 'detailer'): JobApplication => ({
  position,
  full_name: '',
  email: '',
  phone: '',
  city: '',
  years_experience: '',
  experience_detail: '',
  availability: 'Weekdays, daytime',
  start_when: '',
  weekends: true,
  transportation: true,
  has_license: false,
  authorized_to_work: false,
  why: '',
  company_website: '',
});

export function roleById(id: string | null | undefined) {
  return OPEN_ROLES.find((role) => role.id === id) ?? null;
}

export function roleLabel(id: string) {
  return roleById(id)?.title || id;
}

function experienceLabel(years: string) {
  return (
    {
      '': 'Not listed',
      '0': 'Less than a year',
      '1': '1 year',
      '2': '2 years',
      '3': '3–4 years',
      '5': '5+ years',
    }[years] || years
  );
}

export function applicationNotes(app: JobApplication, role = roleById(app.position)) {
  const title = role?.title || app.position;
  const license = app.has_license
    ? 'Yes'
    : role?.fieldRole
      ? 'No / not confirmed'
      : 'Not required for this seat';
  return [
    'Website application',
    `Role: ${title}`,
    `City: ${app.city.trim() || '—'}, NC`,
    `Earliest start: ${app.start_when || '—'}`,
    `Availability: ${app.availability}${app.weekends ? '; some weekends' : ''}`,
    `Related experience: ${experienceLabel(app.years_experience)}`,
    `Driver’s license: ${license}`,
    `Authorized to work in the U.S.: ${app.authorized_to_work ? 'Yes' : 'No'}`,
    `Reliable transportation: ${app.transportation ? 'Yes' : 'No'}`,
    '',
    role?.experiencePrompt || 'Related experience',
    app.experience_detail.trim() || '—',
    '',
    role?.whyPrompt || 'Why this role',
    app.why.trim() || '—',
  ].join('\n');
}

function candidateRow(app: JobApplication) {
  const years = Number(app.years_experience);
  return {
    full_name: app.full_name.trim(),
    email: app.email.trim().toLowerCase(),
    phone: app.phone.replace(/\D/g, ''),
    position: app.position,
    stage: 'applied',
    source: 'Website',
    background_status: 'not_started',
    desired_schedule: `${app.availability}${app.start_when ? ` · start ${app.start_when}` : ''}`,
    city: app.city.trim(),
    years_experience: Number.isFinite(years) ? years : null,
    authorized_to_work: app.authorized_to_work,
    notes: applicationNotes(app),
  };
}

function guestClient() {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function readJson(res: Response) {
  const text = await res.text();
  try { return JSON.parse(text) as Record<string, unknown>; } catch { return { raw: text }; }
}

async function postSameOrigin(app: JobApplication) {
  const res = await fetch('/api/job-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      ...app,
      full_name: app.full_name.trim(),
      email: app.email.trim(),
      phone: app.phone,
      city: app.city.trim(),
      years_experience: Number(app.years_experience) || 0,
      experience_detail: app.experience_detail.trim(),
      why: app.why.trim(),
      start_when: app.start_when,
      has_license: app.has_license,
    }),
  });
  const type = res.headers.get('content-type') || '';
  if (type.includes('text/html')) throw new Error('APPLY_API_MISSING');
  const payload = await readJson(res);
  if (typeof payload.raw === 'string' && payload.raw.trim().startsWith('<')) throw new Error('APPLY_API_MISSING');
  if (!res.ok || typeof payload.error === 'string') {
    throw new Error(String(payload.error || `HTTP ${res.status}`));
  }
  if (payload.id) return { id: String(payload.id), duplicate: Boolean(payload.duplicate) };
  throw new Error('Unable to send your application.');
}

export async function submitJobApplication(app: JobApplication) {
  if (app.company_website.trim()) return { id: 'ok', duplicate: false };

  try {
    return await postSameOrigin(app);
  } catch (sameOriginError) {
    const skipApi = sameOriginError instanceof Error && /APPLY_API_MISSING|404|Failed to fetch/i.test(sameOriginError.message);
    const guest = guestClient();
    if (!guest) {
      throw sameOriginError instanceof Error ? sameOriginError : new Error('Unable to send your application.');
    }

    const body = {
      ...app,
      full_name: app.full_name.trim(),
      email: app.email.trim(),
      phone: app.phone,
      city: app.city.trim(),
      years_experience: Number(app.years_experience) || 0,
      experience_detail: app.experience_detail.trim(),
      why: app.why.trim(),
    };
    const invoked = await guest.functions.invoke('submit-job-application', { body });
    const payload = invoked.data && typeof invoked.data === 'object' ? invoked.data as Record<string, unknown> : {};
    if (typeof payload.error === 'string' && payload.error) throw new Error(payload.error);
    if (payload.id) return { id: String(payload.id), duplicate: Boolean(payload.duplicate) };

    const insert = await guest.from('recruiting_candidates').insert(candidateRow(app));
    if (!insert.error) return { id: 'ok', duplicate: false };
    const slim = { ...candidateRow(app) } as Record<string, unknown>;
    delete slim.city;
    delete slim.years_experience;
    delete slim.authorized_to_work;
    const retry = await guest.from('recruiting_candidates').insert(slim);
    if (!retry.error) return { id: 'ok', duplicate: false };

    const detail = invoked.error?.message || insert.error?.message || retry.error.message
      || (!skipApi && sameOriginError instanceof Error ? sameOriginError.message : '')
      || 'Unable to send your application.';
    throw new Error(String(detail));
  }
}

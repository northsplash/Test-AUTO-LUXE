import { supabase } from './supabase';

export const OPEN_ROLES = [
  {
    id: 'detailer',
    title: 'Mobile Detailer',
    pay: 'Hourly, with room to grow by level',
    summary: 'Bring the North Splash standard to driveways across North Carolina. You run the job, the finish, and the customer walk-around.',
    fits: ['Comfortable working outdoors and on your feet', 'Careful with paint, interiors, and customer property', 'Reliable transportation to job sites'],
  },
  {
    id: 'd2d_agent',
    title: 'Door-to-door Sales',
    pay: 'Weekly base plus commission',
    summary: 'Canvass neighborhoods, run the live pitch, and open customer accounts at the door. You are the first impression of North Splash.',
    fits: ['Comfortable knocking and talking with homeowners', 'Valid driver’s license and a way to get around a territory', 'Okay with commission-based pay'],
  },
  {
    id: 'manager',
    title: 'Operations / Concierge',
    pay: 'Hourly, office and field support',
    summary: 'Keep bookings, customers, and the crew aligned. Phone, dispatch, and the details that make a mobile day run clean.',
    fits: ['Clear written and phone communication', 'Organized under a live schedule', 'Calm with customers and technicians'],
  },
] as const;

export type RoleId = (typeof OPEN_ROLES)[number]['id'];

export type JobApplication = {
  position: RoleId;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  years_experience: string;
  availability: string;
  weekends: boolean;
  transportation: boolean;
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
  availability: 'Weekdays',
  weekends: true,
  transportation: true,
  authorized_to_work: false,
  why: '',
  company_website: '',
});

export function roleLabel(id: string) {
  return OPEN_ROLES.find((r) => r.id === id)?.title || id;
}

function candidateRow(app: JobApplication) {
  const years = Number(app.years_experience);
  const notes = [
    'Website application',
    `City: ${app.city.trim()}, NC`,
    `Availability: ${app.availability}${app.weekends ? ', weekends' : ''}`,
    Number.isFinite(years) ? `Experience: ${years} year${years === 1 ? '' : 's'}` : '',
    `Authorized to work in the U.S.: ${app.authorized_to_work ? 'Yes' : 'No'}`,
    `Reliable transportation: ${app.transportation ? 'Yes' : 'No'}`,
    app.why.trim() ? `Why North Splash:\n${app.why.trim()}` : '',
  ].filter(Boolean).join('\n');
  return {
    full_name: app.full_name.trim(),
    email: app.email.trim().toLowerCase(),
    phone: app.phone.replace(/\D/g, ''),
    position: app.position,
    stage: 'applied',
    source: 'Website',
    background_status: 'not_started',
    desired_schedule: app.availability,
    city: app.city.trim(),
    years_experience: Number.isFinite(years) ? years : null,
    authorized_to_work: app.authorized_to_work,
    notes,
  };
}

export async function submitJobApplication(app: JobApplication) {
  if (app.company_website.trim()) return { id: 'ok', duplicate: false };
  const body = {
    ...app,
    full_name: app.full_name.trim(),
    email: app.email.trim(),
    phone: app.phone,
    city: app.city.trim(),
    years_experience: Number(app.years_experience) || 0,
    why: app.why.trim(),
  };
  const invoked = await supabase.functions.invoke('submit-job-application', { body });
  const payload = invoked.data && typeof invoked.data === 'object' ? invoked.data as Record<string, unknown> : {};
  if (typeof payload.error === 'string' && payload.error) {
    throw new Error(payload.error);
  }
  if (payload.id) {
    return { id: String(payload.id), duplicate: Boolean(payload.duplicate) };
  }
  const insert = await supabase.from('recruiting_candidates').insert(candidateRow(app));
  if (!insert.error) return { id: 'ok', duplicate: false };
  const slim = { ...candidateRow(app) } as Record<string, unknown>;
  delete slim.city;
  delete slim.years_experience;
  delete slim.authorized_to_work;
  const retry = await supabase.from('recruiting_candidates').insert(slim);
  if (retry.error) {
    throw new Error(String(invoked.error?.message || insert.error?.message || retry.error.message || 'Unable to send your application.'));
  }
  return { id: 'ok', duplicate: false };
}

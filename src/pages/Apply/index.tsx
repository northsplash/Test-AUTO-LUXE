import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Check, MapPin } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { MARKET, looksFakePhone } from '@/lib/market';
import {
  OPEN_ROLES,
  emptyApplication,
  roleLabel,
  submitJobApplication,
  type JobApplication,
  type RoleId,
} from '@/lib/careers';

const EXPERIENCE_LABEL: Record<string, string> = {
  '': 'Not listed',
  '0': 'Less than a year',
  '1': '1 year',
  '2': '2 years',
  '3': '3–4 years',
  '5': '5+ years',
};

const STEPS = [
  { n: 1, label: 'Role' },
  { n: 2, label: 'Contact' },
  { n: 3, label: 'Experience' },
  { n: 4, label: 'Review' },
] as const;

const DRAFT_KEY = 'ns-apply-draft-v1';

function validRole(value: string | null): RoleId {
  return OPEN_ROLES.some((r) => r.id === value) ? value as RoleId : 'detailer';
}

function formatStartDate(value: string) {
  if (!value) return 'Not listed';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Apply() {
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ duplicate: boolean } | null>(null);
  const [form, setForm] = useState<JobApplication>(() => {
    const role = validRole(params.get('role'));
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<JobApplication>;
        return { ...emptyApplication(validRole(saved.position || role)), ...saved, position: validRole(params.get('role') || saved.position || role) };
      }
    } catch { /* ignore */ }
    return emptyApplication(role);
  });
  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => {
    if (params.get('role')) return 1;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return 1;
      const saved = JSON.parse(raw) as { step?: number };
      return saved.step === 2 || saved.step === 3 || saved.step === 4 ? saved.step : 1;
    } catch { return 1; }
  });
  const role = OPEN_ROLES.find((r) => r.id === form.position)!;

  const patch = (next: Partial<JobApplication>) => setForm((p) => ({ ...p, ...next }));

  useEffect(() => {
    if (done) return;
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, step })); } catch { /* ignore */ }
  }, [form, step, done]);

  const stepError = useMemo(() => {
    if (step === 1 && !form.position) return 'Choose a role to continue.';
    if (step >= 2 && (form.full_name.trim().length < 2 || !form.email.includes('@') || looksFakePhone(form.phone) || form.city.trim().length < 2)) {
      return 'Name, a valid email, a real 10-digit phone, and your North Carolina city are required.';
    }
    if (step >= 3) {
      if (!form.start_when) return 'Tell us the earliest day you can start.';
      if (!form.years_experience) return 'Select how much related experience you have — “less than a year” is fine.';
      if (form.experience_detail.trim().length < 20) return 'Answer the experience question in a couple of sentences. Hiring reads that first.';
      if (role.fieldRole && !form.has_license) return 'Field roles need a valid driver’s license.';
      if (!form.authorized_to_work) return 'Confirm you are authorized to work in the United States.';
      if (form.why.trim().length < 20) return `Answer “${role.whyPrompt}” in at least a couple of sentences.`;
    }
    return '';
  }, [step, form, role.fieldRole, role.whyPrompt]);

  const goNext = () => {
    if (stepError) {
      setError(stepError);
      return;
    }
    setError('');
    setStep((s) => (s < 4 ? ((s + 1) as 2 | 3 | 4) : s));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stepError) {
      setError(stepError);
      if (step === 4 && (form.full_name.trim().length < 2 || !form.email.includes('@') || looksFakePhone(form.phone) || form.city.trim().length < 2)) setStep(2);
      else if (step === 4) setStep(3);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await submitJobApplication(form);
      setDone({ duplicate: result.duplicate });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Unable to send your application.';
      setError(/row-level security|permission denied|42501|failed to fetch|failed to send|edge function|functionshttperror|non-2xx/i.test(raw)
        ? `Unable to send your application. Call ${MARKET.phone} and we will take it by phone.`
        : raw);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="apply-page">
      <Navigation />
      <main id="main" className="apply-shell">
        <section className="apply-intro">
          <Link className="apply-back" to="/"><ArrowLeft size={16} /> Back to the site</Link>
          <p className="eyebrow">CAREERS · NORTH CAROLINA</p>
          <h1>Apply to work at North Splash.</h1>
          <p>Pick a seat, answer in your own words, send it. No account. Hiring reads every application.</p>
          <span className="apply-market"><MapPin size={14} /> {MARKET.region} · <a href={`tel:${MARKET.phoneTel}`}>{MARKET.phone}</a></span>
        </section>

        <section className="apply-panel">
          {done ? (
            <div className="apply-success">
              <Check size={28} />
              <h2>{done.duplicate ? 'We already have this application.' : 'Application sent.'}</h2>
              <p>
                {done.duplicate
                  ? `A hiring manager already has your ${role.title} application from this week. If anything changed, call ${MARKET.phone}.`
                  : `Thanks, ${form.full_name.split(' ')[0]}. Your ${role.title} application is on the Owner hiring board as Website, with the answers you just wrote. We review new applications by hand and reach out if there is a next step.`}
              </p>
              <dl>
                <div><dt>Role</dt><dd>{role.title}</dd></div>
                <div><dt>Email</dt><dd>{form.email}</dd></div>
                <div><dt>Phone</dt><dd>{form.phone}</dd></div>
              </dl>
              <Link className="btn-primary" to="/">Back to North Splash</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="apply-form">
              <ol className="apply-steps" aria-label="Application steps">
                {STEPS.map((s) => (
                  <li key={s.n} className={step === s.n ? 'active' : step > s.n ? 'done' : ''}>
                    <button type="button" onClick={() => { if (s.n < step) setStep(s.n); }}>{s.n}</button>
                    <span>{s.label}</span>
                  </li>
                ))}
              </ol>

              {step === 1 && (
                <div className="apply-roles">
                  <h2>Choose the seat you actually want.</h2>
                  <p className="apply-fit-lead">Typical weekly pay, not a guarantee. Training and a full book change the number.</p>
                  {OPEN_ROLES.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={form.position === item.id ? 'active' : ''}
                      onClick={() => patch({ position: item.id })}
                    >
                      <Briefcase size={18} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.pay}</small>
                        <em>{item.summary}</em>
                        <ul>
                          {item.duties.map((duty) => <li key={duty}>{duty}</li>)}
                        </ul>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="apply-fields">
                  <h2>How should hiring reach you?</h2>
                  <p className="apply-fit-lead">Use a phone you answer. Fake or all-zero numbers are rejected.</p>
                  <div className="form-row">
                    <label className="form-group"><span>Full name</span><input autoComplete="name" required value={form.full_name} onChange={(e) => patch({ full_name: e.target.value })} /></label>
                    <label className="form-group"><span>City in North Carolina</span><input autoComplete="address-level2" required placeholder="Durham, Charlotte, Wilmington…" value={form.city} onChange={(e) => patch({ city: e.target.value })} /></label>
                  </div>
                  <div className="form-row">
                    <label className="form-group"><span>Email</span><input type="email" autoComplete="email" required value={form.email} onChange={(e) => patch({ email: e.target.value })} /></label>
                    <label className="form-group"><span>Phone</span><input type="tel" inputMode="tel" autoComplete="tel" placeholder={MARKET.phonePlaceholder} value={form.phone} onChange={(e) => patch({ phone: e.target.value })} /></label>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="apply-fields">
                  <h2>{role.title}</h2>
                  <p className="apply-fit-lead">{role.summary}</p>
                  <ul className="apply-fit-list">{role.fits.map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul>
                  <div className="form-row">
                    <label className="form-group">
                      <span>Years of related experience</span>
                      <select value={form.years_experience} onChange={(e) => patch({ years_experience: e.target.value })}>
                        <option value="">Select</option>
                        <option value="0">Less than a year — still learning</option>
                        <option value="1">About 1 year</option>
                        <option value="2">About 2 years</option>
                        <option value="3">3–4 years</option>
                        <option value="5">5+ years</option>
                      </select>
                    </label>
                    <label className="form-group">
                      <span>Earliest start date</span>
                      <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.start_when} onChange={(e) => patch({ start_when: e.target.value })} />
                    </label>
                  </div>
                  <div className="form-row">
                    <label className="form-group">
                      <span>Hours you can actually work</span>
                      <select value={form.availability} onChange={(e) => patch({ availability: e.target.value })}>
                        <option>Weekdays, daytime</option>
                        <option>Evenings after 5</option>
                        <option>Weekends</option>
                        <option>Flexible / as needed</option>
                      </select>
                    </label>
                  </div>
                  <label className="form-group">
                    <span>{role.experiencePrompt}</span>
                    <textarea rows={4} placeholder={role.experiencePlaceholder} value={form.experience_detail} onChange={(e) => patch({ experience_detail: e.target.value })} />
                  </label>
                  {role.fieldRole && (
                    <label className="apply-check">
                      <input type="checkbox" checked={form.has_license} onChange={(e) => patch({ has_license: e.target.checked })} />
                      <span>I have a valid driver’s license and can legally drive to jobs or a territory.</span>
                    </label>
                  )}
                  <label className="apply-check"><input type="checkbox" checked={form.weekends} onChange={(e) => patch({ weekends: e.target.checked })} /><span>I can take some Saturdays or Sundays when the board is full.</span></label>
                  <label className="apply-check"><input type="checkbox" checked={form.transportation} onChange={(e) => patch({ transportation: e.target.checked })} /><span>{role.fieldRole ? 'I have reliable transportation to neighborhoods and job sites.' : 'I can get to the desk or a job site when operations needs me on-site.'}</span></label>
                  <label className="apply-check"><input type="checkbox" checked={form.authorized_to_work} onChange={(e) => patch({ authorized_to_work: e.target.checked })} /><span>I am authorized to work in the United States.</span></label>
                  <label className="form-group">
                    <span>{role.whyPrompt}</span>
                    <textarea rows={4} placeholder={role.whyPlaceholder} value={form.why} onChange={(e) => patch({ why: e.target.value })} />
                  </label>
                  <label className="apply-honeypot" aria-hidden="true">
                    Company website
                    <input tabIndex={-1} autoComplete="off" value={form.company_website} onChange={(e) => patch({ company_website: e.target.value })} />
                  </label>
                </div>
              )}

              {step === 4 && (
                <div className="apply-review">
                  <h2>Read it once, then send.</h2>
                  <p>This goes to the North Splash hiring board as written. A manager will call or email if there is a next step — the website does not auto-hire.</p>
                  <dl>
                    <div><dt>Role</dt><dd>{roleLabel(form.position)}</dd></div>
                    <div><dt>Name</dt><dd>{form.full_name}</dd></div>
                    <div><dt>Contact</dt><dd>{form.email} · {form.phone}</dd></div>
                    <div><dt>City</dt><dd>{form.city}, NC</dd></div>
                    <div><dt>Start</dt><dd>{formatStartDate(form.start_when)}</dd></div>
                    <div><dt>Hours</dt><dd>{form.availability}{form.weekends ? ' · some weekends' : ''}</dd></div>
                    <div><dt>Years</dt><dd>{EXPERIENCE_LABEL[form.years_experience] || 'Not listed'}</dd></div>
                    {role.fieldRole && <div><dt>License</dt><dd>{form.has_license ? 'Valid driver’s license' : 'Not confirmed'}</dd></div>}
                    <div><dt>Work status</dt><dd>{form.authorized_to_work ? 'Authorized to work in the U.S.' : 'Not confirmed'}</dd></div>
                    <div><dt>Transport</dt><dd>{form.transportation ? 'Reliable transportation' : 'Needs a plan'}</dd></div>
                    <div><dt>Experience</dt><dd>{form.experience_detail}</dd></div>
                    <div><dt>Why</dt><dd>{form.why}</dd></div>
                  </dl>
                </div>
              )}

              {error && <p className="apply-error" role="alert">{error}</p>}

              <div className="apply-actions">
                {step > 1 && <button type="button" className="btn-outline" onClick={() => { setError(''); setStep((s) => ((s - 1) as 1 | 2 | 3)); }}>Back</button>}
                {step < 4
                  ? <button type="button" className="btn-primary" onClick={goNext}>Continue <ArrowRight size={16} /></button>
                  : <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Submit application'}</button>}
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

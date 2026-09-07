import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChevronDown, Check, Plus, Minus, ArrowRight, Sparkles, Shield, Star, Zap,
  Car, Package, Gem, Camera, Crown, Calendar, HelpCircle, ArrowLeft, Clock,
  Search, X
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CursorGlow, Filmstrip, Marquee, ScrollProgress, TiltCard, useParallax } from '@/components/SiteMotion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  SERVICES, PACKAGES, MEMBERSHIPS, ADD_ONS, VEHICLE_SIZES, FAQS, money,
  BOOKABLE_SERVICES, DETAIL_FAMILIES, DETAIL_FAMILY_COPY, DEFAULT_PACKAGE_ID,
  COATING_TIERS, packagesForFamily, serviceSelectGroups, formatDuration,
  compareRowsForFamily, GALLERY_PIECES, GALLERY_FILTERS, FAQ_GROUPS,
  PROTECTION_PROCESS, PROTECTION_AFTERCARE, MEMBERSHIP_COMPARE,
} from '@/lib/data';
import type { DetailFamily } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { trackPageView } from '@/lib/auth';

const OS_URL = 'https://ns-auto-luxe-os.vercel.app';
const BOOK_SLOTS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:30 PM', '4:00 PM'] as const;

function localYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function preferredDateOptions() {
  const start = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      value: localYmd(d),
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });
}

function tomorrowYmd() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return localYmd(d);
}

function toScheduledIso(date: string, time: string) {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m || !date) return '';
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && hour < 12) hour += 12;
  if (ap === 'AM' && hour === 12) hour = 0;
  const next = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  return Number.isNaN(next.getTime()) ? '' : next.toISOString();
}
const SERVICE_FILTERS = ['All', 'Exterior', 'Interior', 'Full', 'Paint', 'Ceramic'] as const;
const FILTER_CATEGORY: Record<string, string | null> = {
  All: null,
  Exterior: 'Exterior',
  Interior: 'Interior',
  Full: 'Detail',
  Paint: 'Paint',
  Ceramic: 'Ceramic',
};

function serviceByTitle(needle: string) {
  return SERVICES.find((s) => s.title.toLowerCase().includes(needle.toLowerCase())) ?? SERVICES[0];
}

function bookableById(id: string) {
  return BOOKABLE_SERVICES.find((pkg) => pkg.id === id) ?? BOOKABLE_SERVICES.find((pkg) => pkg.id === DEFAULT_PACKAGE_ID)!;
}

type TabId = 'services' | 'packages' | 'protection' | 'gallery' | 'membership' | 'booking' | 'faq';
type BookingStep = 1 | 2 | 3 | 4;

const BOOK_STEPS: { n: BookingStep; label: string; hint: string }[] = [
  { n: 1, label: 'Service', hint: 'Choose a package' },
  { n: 2, label: 'Vehicle', hint: 'Size & add-ons' },
  { n: 3, label: 'Window', hint: 'When & where' },
  { n: 4, label: 'Contact', hint: 'Your details' },
];

function CompareCell({ value }: { value: boolean | 'optional' }) {
  if (value === true) return <span className="compare-yes"><Check size={14} /> Included</span>;
  if (value === 'optional') return <span className="compare-opt">Optional</span>;
  return <span className="compare-no"><X size={12} /> —</span>;
}

const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: 'services', label: 'Services', Icon: Car },
  { id: 'packages', label: 'Packages', Icon: Package },
  { id: 'protection', label: 'Protection', Icon: Gem },
  { id: 'gallery', label: 'Gallery', Icon: Camera },
  { id: 'membership', label: 'Membership', Icon: Crown },
  { id: 'booking', label: 'Book', Icon: Calendar },
  { id: 'faq', label: 'FAQ', Icon: HelpCircle },
];

function FadeIn({
  children,
  delay = 0,
  className = '',
  variant = 'up',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  variant?: 'up' | 'left' | 'right' | 'scale';
}) {
  const { ref, visible } = useScrollAnimation();
  const variantClass = variant === 'up' ? '' : `reveal-${variant}`;
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={`reveal ${variantClass} ${visible ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const location = useLocation();
  const [paidNotice, setPaidNotice] = useState(() => Boolean((location.state as { paymentSuccess?: boolean } | null)?.paymentSuccess));
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [serviceFilter, setServiceFilter] = useState('All');
  const [compareFamily, setCompareFamily] = useState<DetailFamily>('full');
  const [galleryFilter, setGalleryFilter] = useState<(typeof GALLERY_FILTERS)[number]>('All');
  const [faqQuery, setFaqQuery] = useState('');
  const [faqGroup, setFaqGroup] = useState<(typeof FAQ_GROUPS)[number]>('All');
  const [bookingStep, setBookingStep] = useState<BookingStep>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState(DEFAULT_PACKAGE_ID);
  const [coatingYears, setCoatingYears] = useState<1 | 3 | 5>(1);
  const [vehicle, setVehicle] = useState(0);
  const [condition, setCondition] = useState('Light');
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [formSent, setFormSent] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSending, setBookingSending] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', vehicle: '', address: '', notes: '', preferred_date: tomorrowYmd(), preferred_time: '10:00 AM' });
  const [bookingReceipt, setBookingReceipt] = useState<{ id?: string; service: string; when: string; where: string; name: string } | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [counterVal, setCounterVal] = useState(0);
  const tabRef = useRef<HTMLDivElement>(null);
  const heroShift = useParallax(0.34);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    trackPageView('/').catch(() => {});
  }, []);

  useEffect(() => {
    const id = location.hash.replace('#', '');
    if ((TABS.some((tab) => tab.id === id) || id === 'booking') && id) {
      setActiveTab(id as TabId);
    }
  }, [location.hash]);

  useEffect(() => {
    if (heroVisible) {
      const target = 250;
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        setCounterVal(Math.round(current));
        if (current >= target) clearInterval(timer);
      }, 16);
      return () => clearInterval(timer);
    }
  }, [heroVisible]);

  const scrollTo = (id: string) => {
    if (id === 'booking') {
      setActiveTab('booking');
      setTimeout(() => tabRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else if (id === 'contact' || id === 'reviews') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveTab(id as TabId);
      setTimeout(() => tabRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const selectedBookable = bookableById(selectedServiceId);

  const estimated = useMemo(() => {
    const booked = bookableById(selectedServiceId);
    const base = booked.id === 'ceramic-coating'
      ? (COATING_TIERS.find((tier) => tier.years === coatingYears)?.price ?? booked.price)
      : booked.price;
    const size = VEHICLE_SIZES[vehicle].extra;
    const condExtra = condition === 'Moderate' ? 35 : condition === 'Heavy' ? 75 : condition === 'Severe' ? 125 : 0;
    const extras = selectedAddOns.reduce((sum, i) => sum + ADD_ONS[i][1], 0);
    return base + size + condExtra + extras;
  }, [selectedServiceId, coatingYears, vehicle, condition, selectedAddOns]);

  const toggleAddOn = (i: number) => {
    setSelectedAddOns(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i]);
  };

  const filterCategory = FILTER_CATEGORY[serviceFilter] ?? null;
  const filtered = filterCategory ? SERVICES.filter((s) => s.category === filterCategory) : SERVICES;
  const galleryPieces = galleryFilter === 'All' ? GALLERY_PIECES : GALLERY_PIECES.filter((piece) => piece.tag === galleryFilter);
  const compareRows = compareRowsForFamily(compareFamily);
  const comparePackages = packagesForFamily(compareFamily);
  const visibleFaqs = FAQS.filter((item) => {
    const groupOk = faqGroup === 'All' || item.group === faqGroup;
    const q = faqQuery.trim().toLowerCase();
    const queryOk = !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    return groupOk && queryOk;
  });
  const preferredWhen = `${preferredDateOptions().find((d) => d.value === formData.preferred_date)?.label || formData.preferred_date} · ${formData.preferred_time}`;
  const estimateLines = [
    selectedBookable.name + (selectedBookable.id === 'ceramic-coating' ? ` (${coatingYears}-year)` : ''),
    VEHICLE_SIZES[vehicle].name,
    condition === 'Light' ? null : `${condition} condition`,
    ...selectedAddOns.map((i) => ADD_ONS[i][0]),
  ].filter(Boolean) as string[];

  const bookService = (title: string) => {
    const match = BOOKABLE_SERVICES.find((pkg) => pkg.name === title);
    if (match) {
      setSelectedServiceId(match.id);
      if (match.id === 'ceramic-coating') setCoatingYears(1);
    }
    setBookingStep(2);
    openTab('booking');
  };

  const goBookingWith = (id: string, years?: 1 | 3 | 5) => {
    setSelectedServiceId(id);
    if (id === 'ceramic-coating') setCoatingYears(years ?? 1);
    setBookingStep(2);
    openTab('booking');
  };

  const advanceBooking = () => {
    if (bookingStep === 3 && !formData.address.trim()) {
      setBookingError('Add the service address so we know where to meet you.');
      return;
    }
    setBookingError('');
    setBookingStep((step) => (Math.min(4, step + 1) as BookingStep));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSent) return;
    if (!formData.address.trim()) {
      setBookingError('Add the service address so we know where to meet you.');
      setBookingStep(3);
      return;
    }
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setBookingError('Name, phone, and email are required.');
      setBookingStep(4);
      return;
    }
    setBookingError('');
    setBookingSending(true);
    try {
      const where = formData.address.trim() || 'Raleigh, NC 27616';
      const dateOptions = preferredDateOptions();
      const whenLabel = `${dateOptions.find((d) => d.value === formData.preferred_date)?.label || formData.preferred_date} · ${formData.preferred_time}`;
      const windowNote = `Preferred window: ${whenLabel}`;
      const { data, error } = await supabase.functions.invoke('public-booking', {
        body: {
          customer_name: formData.name.trim(),
          customer_email: formData.email.trim(),
          customer_phone: formData.phone.trim(),
          service_name: selectedBookable.name,
          package_name: selectedBookable.id === 'ceramic-coating'
            ? `${selectedBookable.name} (${coatingYears}-year)`
            : selectedBookable.name,
          add_ons: selectedAddOns.map(i => ADD_ONS[i][0]),
          vehicle_info: formData.vehicle.trim(),
          service_address: where,
          preferred_date: formData.preferred_date,
          preferred_time: formData.preferred_time,
          scheduled_at: toScheduledIso(formData.preferred_date, formData.preferred_time) || null,
          price: estimated,
          notes: [windowNote, formData.address.trim() && `Service location: ${where}`, formData.notes.trim()].filter(Boolean).join('\n'),
          source_channel: 'northsplash.com',
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unable to submit booking.');
      setBookingReceipt({
        id: data.appointment_id,
        name: formData.name.trim(),
        service: selectedBookable.name,
        when: whenLabel,
        where,
      });
      setFormSent(true);
    } catch (err: any) {
      setBookingError(err?.message || 'Unable to submit your booking right now. Please try again.');
    } finally {
      setBookingSending(false);
    }
  };

  const openTab = (tab: TabId) => {
    setActiveTab(tab);
    setTimeout(() => tabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const closeTab = () => {
    setActiveTab(null);
    setTimeout(() => tabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  return (
    <div className="site">
      <ScrollProgress />
      <CursorGlow />
      <Navigation onScrollTo={scrollTo} isHomePage />
      {paidNotice && (
        <div className="luxe-paid-banner" role="status">
          <strong>Payment received.</strong>
          <span>Your appointment is confirmed. We’ll see you at the scheduled window.</span>
          <button type="button" onClick={() => setPaidNotice(false)}>Dismiss</button>
        </div>
      )}

      {/* HERO */}
      <section id="home" className="hero">
        <div
          className="hero-bg"
          style={{ transform: `translate3d(0, ${heroShift}px, 0)` }}
        >
          <img
            src="https://images.pexels.com/photos/33345481/pexels-photo-33345481.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900"
            srcSet="https://images.pexels.com/photos/33345481/pexels-photo-33345481.jpeg?auto=compress&cs=tinysrgb&w=800 800w, https://images.pexels.com/photos/33345481/pexels-photo-33345481.jpeg?auto=compress&cs=tinysrgb&w=1600 1600w, https://images.pexels.com/photos/33345481/pexels-photo-33345481.jpeg?auto=compress&cs=tinysrgb&w=2400 2400w"
            sizes="100vw"
            alt="Luxury vehicle after a North Splash Auto Luxe detail"
          />
          <div className="hero-gradient" />
          <div className="hero-noise" />
        </div>
        <div className="hero-lockup" aria-hidden="true">
          <img src="/ns-auto-luxe-full-logo.png" alt="" />
        </div>

        <div className={`hero-content ${heroVisible ? 'hero-visible' : ''}`}>
          <p className="eyebrow eyebrow-glow">PREMIUM AUTOMOTIVE CARE</p>
          <h1 className="hero-title">
            <span className="hero-word"><span>Elevate</span></span>
            <em className="hero-word hero-word-em"><span>Your Drive.</span></em>
          </h1>
          <p className="hero-copy">
            Mobile detailing from Raleigh, NC 27616. Precision care, paint enhancement, ceramic protection, and concierge service at your driveway.
          </p>
          <div className="hero-actions">
            <button className="btn-white" onClick={() => scrollTo('booking')}>
              Book Your Detail <ArrowRight size={16} />
            </button>
            <button className="btn-ghost" onClick={() => scrollTo('services')}>
              Explore Services
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{counterVal}+</strong>
              <span>Vehicles Detailed</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong>5★</strong>
              <span>Client Rating</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <strong>3</strong>
              <span>Coating Tiers</span>
            </div>
          </div>
        </div>

        <button className="hero-scroll" onClick={() => scrollTo('services')}>
          <ChevronDown size={22} />
        </button>
      </section>

      {/* INTRO */}
      <section className="intro-section">
        <FadeIn>
          <p className="eyebrow">THE LUXE STANDARD</p>
          <h2>Clean is the beginning.<br /><em>Exceptional is the goal.</em></h2>
        </FadeIn>
        <FadeIn delay={120} variant="right" className="intro-right">
          <p>North Splash Auto Luxe brings a premium mindset to automotive care. Every service is built around the condition of your vehicle, the finish you want, and the experience you expect.</p>
          <div className="intro-pillars">
            {[
              [Sparkles, 'Precision Detail', 'Every panel, every surface'],
              [Shield, 'Long-Term Protection', 'Ceramic & sealant options'],
              [Star, 'White Glove Service', 'Concierge available'],
              [Zap, 'Fast Turnaround', 'Most services same-day'],
            ].map(([Icon, title, sub]) => (
              <div className="intro-pillar" key={String(title)}>
                <div className="pillar-icon"><Icon size={18} /></div>
                <div>
                  <strong>{String(title)}</strong>
                  <span>{String(sub)}</span>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <Marquee
        items={[
          ...PACKAGES.map((pkg) => `${pkg.name}  ${money(pkg.price)}+`),
          'Paint Correction  $350+',
          'Ceramic Coating  $650+',
          'Luxe Membership  from $99/mo',
        ]}
      />

      {activeTab === null && (
        <section className="statement-section">
          <FadeIn variant="scale">
            <p className="eyebrow">THE CATALOG</p>
            <h2>Nine selves.<em>One standard.</em></h2>
            <p className="statement-kicker">
              Exterior, interior, or the full vehicle — Essential, Signature, and Elite — plus paint correction and ceramic coating that actually lasts.
            </p>
          </FadeIn>
        </section>
      )}

      {activeTab === null && (
        <Filmstrip
          frames={[
            { src: serviceByTitle('Exterior Signature').image, caption: 'Exterior Signature' },
            { src: serviceByTitle('Interior Signature').image, caption: 'Interior Care' },
            { src: serviceByTitle('Luxe Signature').image, caption: 'Luxe Signature' },
            { src: serviceByTitle('Paint Correction').image, caption: 'Paint Correction' },
            { src: serviceByTitle('Ceramic').image, caption: 'Ceramic Coating' },
            { src: serviceByTitle('Luxe Elite').image, caption: 'Luxe Elite' },
          ]}
        />
      )}

      {/* TAB NAVIGATION */}
      <div className="tab-nav-wrap" ref={tabRef}>
        <div className="tab-nav">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`tab-nav-btn ${activeTab === id ? 'tab-nav-active' : ''}`}
              onClick={() => openTab(id)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* TEASER CARDS (shown when no tab is active) */}
      {activeTab === null && (
        <section className="teasers-section">
          <FadeIn className="center-heading">
            <p className="eyebrow">EXPLORE</p>
            <h2>Everything your vehicle deserves.</h2>
            <p>Tap any section to dive deeper. Book when you're ready.</p>
          </FadeIn>

          <div className="teaser-grid">
            {/* Services teaser */}
            <TiltCard className="teaser-card" delay={0}>
              <div className="teaser-img">
                <img src={serviceByTitle('Exterior Essential').image} alt="Services" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Car size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">SERVICES</p>
                <h3>Care without shortcuts</h3>
                <p>Nine detail selves plus paint correction and ceramic coating. {SERVICES.length} services from {money(SERVICES[0].price)} — duration and inclusions on every card.</p>
                <button className="teaser-link" onClick={() => openTab('services')}>
                  View services <ArrowRight size={13} />
                </button>
              </div>
            </TiltCard>

            {/* Packages teaser */}
            <TiltCard className="teaser-card" delay={80}>
              <div className="teaser-img">
                <img src={serviceByTitle('Luxe Signature').image} alt="Packages" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Package size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">PACKAGES</p>
                <h3>Choose your level of Luxe</h3>
                <p>Exterior, interior, and full-vehicle selves — Essential, Signature, and Elite — from {money(PACKAGES[0].price)} to {money(PACKAGES[PACKAGES.length - 1].price)}.</p>
                <button className="teaser-link" onClick={() => openTab('packages')}>
                  Compare packages <ArrowRight size={13} />
                </button>
              </div>
            </TiltCard>

            {/* Protection teaser */}
            <TiltCard className="teaser-card" delay={160}>
              <div className="teaser-img">
                <img src={serviceByTitle('Ceramic').image} alt="Protection" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Gem size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">PROTECTION</p>
                <h3>Built to protect</h3>
                <p>Ceramic coating in 1, 3, and 5-year tiers — with the prep, cure, and aftercare a coating studio would show you.</p>
                <button className="teaser-link" onClick={() => openTab('protection')}>
                  Explore protection <ArrowRight size={13} />
                </button>
              </div>
            </TiltCard>

            {/* Gallery teaser */}
            <TiltCard className="teaser-card" delay={0}>
              <div className="teaser-img">
                <img src={serviceByTitle('Paint Correction').image} alt="Gallery" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Camera size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">GALLERY</p>
                <h3>Made to be seen</h3>
                <p>Premium vehicles. Precise finishes. The details that change the whole look.</p>
                <button className="teaser-link" onClick={() => openTab('gallery')}>
                  View gallery <ArrowRight size={13} />
                </button>
              </div>
            </TiltCard>

            {/* Membership teaser */}
            <TiltCard className="teaser-card" delay={80}>
              <div className="teaser-img">
                <img src={serviceByTitle('Interior Signature').image} alt="Membership" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Crown size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">MEMBERSHIP</p>
                <h3>Don't wait until it needs rescuing</h3>
                <p>Three maintenance plans from {money(MEMBERSHIPS[0].price)}/mo. Most members choose Luxe Plus.</p>
                <button className="teaser-link" onClick={() => openTab('membership')}>
                  See plans <ArrowRight size={13} />
                </button>
              </div>
            </TiltCard>

            {/* Booking teaser */}
            <TiltCard className="teaser-card teaser-cta" delay={160}>
              <div className="teaser-body teaser-body-cta">
                <p className="eyebrow">BOOK NOW</p>
                <h3>Get an instant estimate</h3>
                <p>Four steps: service, vehicle, window, contact. A live estimate stays with you the whole way.</p>
                <button className="btn-primary" onClick={() => openTab('booking')}>
                  Book Your Detail <ArrowRight size={14} />
                </button>
              </div>
            </TiltCard>
          </div>
        </section>
      )}

      {/* TAB CONTENT */}
      {activeTab !== null && (
        <section className="tab-content-section">
          <div className="tab-content-header">
            <button className="tab-back" onClick={closeTab}>
              <ArrowLeft size={16} /> Back to overview
            </button>
            <h2>{TABS.find(t => t.id === activeTab)?.label}</h2>
          </div>

          {/* SERVICES TAB — studio catalog: duration, from-price, included list, most booked */}
          {activeTab === 'services' && (
            <div className="tab-panel">
              <FadeIn className="section-header">
                <div>
                  <p className="eyebrow">STUDIO CATALOG</p>
                  <h2>Care without shortcuts.</h2>
                </div>
                <p>Duration, a from-price, and what’s included — the way a ceramic studio lists work, not a wash menu.</p>
              </FadeIn>
              <div className="filter-row filter-row-light">
                {SERVICE_FILTERS.map(f => (
                  <button key={f} className={`filter-btn filter-btn-light ${serviceFilter === f ? 'filter-active-light' : ''}`} onClick={() => setServiceFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="service-grid">
                {filtered.map((s, i) => (
                  <FadeIn key={s.title} delay={i * 60} className={`service-card ${s.popular ? 'service-card-popular' : ''}`}>
                    <div className="service-img">
                      <img src={s.image} alt={s.title} />
                      <div className="service-img-overlay" />
                      {s.popular && <span className="service-popular">Most booked</span>}
                      <span className="service-badge">{s.category}</span>
                    </div>
                    <div className="service-body">
                      <div className="service-top">
                        <h3>{s.title}</h3>
                        <strong className="service-price"><span>from</span> {money(s.price)}</strong>
                      </div>
                      <p className="service-minutes"><Clock size={12} /> About {formatDuration(s.minutes)}</p>
                      <p>{s.desc}</p>
                      <ul>
                        {s.items.map(item => <li key={item}><Check size={11} /> {item}</li>)}
                      </ul>
                      <button className="service-cta" onClick={() => bookService(s.title)}>
                        Book this service <ArrowRight size={13} />
                      </button>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}

          {/* PACKAGES TAB — Tesla/Apple Good-Better-Best matrix */}
          {activeTab === 'packages' && (
            <div className="tab-panel">
              <FadeIn className="center-heading">
                <p className="eyebrow">COMPARE THE THREE SELVES</p>
                <h2>Essential, Signature, or Elite.</h2>
                <p>A side-by-side like a product compare page. Signature is the one most owners book. Vehicle size and condition can change the final total.</p>
              </FadeIn>

              <div className="filter-row filter-row-light compare-family-nav">
                {DETAIL_FAMILIES.map((family) => (
                  <button
                    key={family}
                    className={`filter-btn filter-btn-light ${compareFamily === family ? 'filter-active-light' : ''}`}
                    onClick={() => setCompareFamily(family)}
                  >
                    {DETAIL_FAMILY_COPY[family].title}
                  </button>
                ))}
              </div>
              <p className="compare-family-blurb">{DETAIL_FAMILY_COPY[compareFamily].blurb}</p>

              <div className="packages-grid">
                {comparePackages.map((p) => (
                  <FadeIn key={p.id} className={`package-card ${p.featured ? 'package-featured' : ''}`}>
                    <span className="package-tag">{p.tag}</span>
                    {p.featured && <div className="package-glow" />}
                    <h3>{p.name}</h3>
                    <div className="package-price">{money(p.price)}<sup>+</sup></div>
                    <p className="package-minutes"><Clock size={12} /> About {formatDuration(p.minutes)}</p>
                    <p>{p.desc}</p>
                    <button
                      className={p.featured ? 'btn-primary btn-full' : 'btn-dark btn-full'}
                      onClick={() => goBookingWith(p.id)}
                    >
                      Choose {p.self === 'signature' ? 'Signature' : p.name}
                    </button>
                  </FadeIn>
                ))}
              </div>

              <div className="compare-wrap">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>What’s included</th>
                      {comparePackages.map((p) => (
                        <th key={p.id} className={p.featured ? 'is-popular' : ''}>
                          {p.self.charAt(0).toUpperCase() + p.self.slice(1)}
                          <small>from {money(p.price)}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        <td><CompareCell value={row.essential} /></td>
                        <td className="is-popular"><CompareCell value={row.signature} /></td>
                        <td><CompareCell value={row.elite} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {DETAIL_FAMILIES.filter((family) => family !== compareFamily).map((family) => (
                <div key={family} className="package-family package-family-secondary">
                  <div className="package-family-head">
                    <p className="eyebrow">{DETAIL_FAMILY_COPY[family].kicker}</p>
                    <h3>{DETAIL_FAMILY_COPY[family].title}</h3>
                    <p>{DETAIL_FAMILY_COPY[family].blurb}</p>
                  </div>
                  <div className="packages-grid packages-grid-compact">
                    {packagesForFamily(family).map((p) => (
                      <button
                        key={p.id}
                        className={`package-mini ${p.featured ? 'is-featured' : ''}`}
                        onClick={() => goBookingWith(p.id)}
                      >
                        <span>{p.tag}</span>
                        <strong>{p.name}</strong>
                        <em>from {money(p.price)}</em>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <FadeIn className="pricing-note">
                <strong>Vehicle-size pricing:</strong> Sedan/Coupe +$0 · Small SUV +$25 · Large SUV/Truck +$50 · Three-Row/Large Truck +$75. Final pricing may vary by condition.
              </FadeIn>
            </div>
          )}

          {/* PROTECTION TAB — coating studio: process, warranty years, aftercare */}
          {activeTab === 'protection' && (
            <div className="tab-panel">
              <div className="protection-section">
                <FadeIn className="protection-left">
                  <img src={serviceByTitle('Ceramic').image} alt="Ceramic coating" />
                  <div className="protection-img-accent" />
                </FadeIn>
                <FadeIn className="protection-right" delay={150}>
                  <p className="eyebrow">LUXE PROTECTION</p>
                  <h2>More than shine.<br /><em>Built to protect.</em></h2>
                  <p>Ceramic coating is a process, not a product pour. We prep, coat, and cure — then you pick a 1-, 3-, or 5-year film the way a coating studio would explain warranty.</p>
                  <div className="protection-tiers">
                    {COATING_TIERS.map((tier) => (
                      <button
                        type="button"
                        key={tier.label}
                        className={`protection-tier ${coatingYears === tier.years ? 'is-selected' : ''}`}
                        onClick={() => setCoatingYears(tier.years)}
                      >
                        {tier.popular && <em className="tier-popular">Most chosen</em>}
                        <span>{tier.label}</span>
                        <strong>{money(tier.price)}<sup>+</sup></strong>
                        <small>{tier.suited}</small>
                      </button>
                    ))}
                  </div>
                  <ul className="protection-includes">
                    {COATING_TIERS.find((tier) => tier.years === coatingYears)?.includes.map((item) => (
                      <li key={item}><Check size={12} /> {item}</li>
                    ))}
                  </ul>
                  <button
                    className="btn-dark"
                    onClick={() => goBookingWith('ceramic-coating', coatingYears)}
                  >
                    Request {coatingYears}-year coating
                  </button>
                </FadeIn>
              </div>

              <div className="coat-process">
                <FadeIn className="center-heading">
                  <p className="eyebrow">THE COATING PROCESS</p>
                  <h2>Prep. Coat. Cure. Inspect.</h2>
                </FadeIn>
                <div className="coat-process-grid">
                  {PROTECTION_PROCESS.map((item) => (
                    <div key={item.step} className="coat-step">
                      <span>{item.step}</span>
                      <h3>{item.title}</h3>
                      <p>{item.copy}</p>
                    </div>
                  ))}
                </div>
                <div className="coat-aftercare">
                  <p className="eyebrow">AFTERCARE</p>
                  <ul>
                    {PROTECTION_AFTERCARE.map((item) => (
                      <li key={item}><Check size={12} /> {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="addons-section" style={{ background: 'var(--black)', padding: '80px 7vw', marginTop: '0' }}>
                <FadeIn className="section-header dark-header">
                  <div>
                    <p className="eyebrow eyebrow-dim">LUXE ADD-ONS</p>
                    <h2>Make it yours.</h2>
                  </div>
                  <p>Build your service around what your vehicle actually needs. Selections carry into Book.</p>
                </FadeIn>
                <div className="addons-grid">
                  {ADD_ONS.map(([name, price], i) => (
                    <button
                      key={name}
                      className={`addon-btn ${selectedAddOns.includes(i) ? 'addon-selected' : ''}`}
                      onClick={() => toggleAddOn(i)}
                    >
                      <span>{name}</span>
                      <strong>+{money(price)}</strong>
                      {selectedAddOns.includes(i) && <div className="addon-check"><Check size={10} /></div>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GALLERY TAB — studio portfolio with filters and captions */}
          {activeTab === 'gallery' && (
            <div className="tab-panel">
              <FadeIn className="center-heading">
                <p className="eyebrow">THE LUXE COLLECTION</p>
                <h2>Made to be seen.</h2>
                <p>Filter by work type the way a ceramic house shows a portfolio — captions on every piece, not a random photo dump.</p>
              </FadeIn>
              <div className="filter-row filter-row-light">
                {GALLERY_FILTERS.map((tag) => (
                  <button
                    key={tag}
                    className={`filter-btn filter-btn-light ${galleryFilter === tag ? 'filter-active-light' : ''}`}
                    onClick={() => setGalleryFilter(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {galleryPieces.length === 0 ? (
                <p className="gallery-empty">No pieces in this filter yet. Try All or another finish.</p>
              ) : (
                <div className="gallery-grid">
                  {galleryPieces.map((piece) => (
                    <figure key={piece.id} className={`gallery-cell ${galleryFilter === 'All' && piece.layout === 'main' ? 'gallery-main' : ''} ${galleryFilter === 'All' && piece.layout === 'wide' ? 'gallery-wide' : ''}`}>
                      <img src={piece.src} alt={piece.title} />
                      <figcaption className="gallery-caption">
                        <span>{piece.tag}</span>
                        <strong>{piece.title}</strong>
                        <em>{piece.caption}</em>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}

              <div className="luxury-banner" style={{ marginTop: '40px' }}>
                <img src="https://images.pexels.com/photos/27968215/pexels-photo-27968215.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Luxury vehicle" />
                <div className="banner-overlay" />
                <FadeIn className="banner-content">
                  <p className="eyebrow eyebrow-glow">THE LUXE COLLECTION</p>
                  <h2>Luxury vehicles<br />deserve luxury care.</h2>
                  <p>Specialized service for premium, exotic, collector, and specialty vehicles.</p>
                  <button className="btn-ghost" onClick={() => scrollTo('contact')}>Request a Custom Quote</button>
                </FadeIn>
              </div>
            </div>
          )}

          {/* MEMBERSHIP TAB — wash-club: recommended plan, billed monthly */}
          {activeTab === 'membership' && (
            <div className="tab-panel">
              <FadeIn className="center-heading">
                <p className="eyebrow">LUXE MEMBERSHIP</p>
                <h2>Don't wait until your car needs rescuing.</h2>
                <p>Billed monthly, pause anytime. Most members choose Luxe Plus — the maintenance club plan with priority scheduling.</p>
              </FadeIn>
              <div className="membership-grid">
                {MEMBERSHIPS.map((plan, i) => (
                  <FadeIn key={plan.name} delay={i * 80} className={`membership-card ${plan.recommended ? 'membership-recommended' : ''}`}>
                    {plan.recommended && <span className="member-pick">Most members choose</span>}
                    <p className="eyebrow">{plan.name.toUpperCase()}</p>
                    <div className="member-price">
                      {money(plan.price)}<small>/month</small>
                    </div>
                    <p className="member-billed">{plan.billed}</p>
                    <p>{plan.desc}</p>
                    <ul>
                      {plan.features.map(f => <li key={f}><Check size={11} /> {f}</li>)}
                    </ul>
                    <div className="member-savings-badge">
                      <Shield size={12} /> {plan.savings}
                    </div>
                    <a href={`${OS_URL}/login?mode=signup`} className={plan.recommended ? 'btn-primary btn-full' : 'btn-outline btn-full'}>Join {plan.name}</a>
                  </FadeIn>
                ))}
              </div>

              <div className="compare-wrap member-compare">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>Plan comparison</th>
                      <th>Monthly</th>
                      <th className="is-popular">Plus</th>
                      <th>VIP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MEMBERSHIP_COMPARE.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        <td><CompareCell value={row.monthly} /></td>
                        <td className="is-popular"><CompareCell value={row.plus} /></td>
                        <td><CompareCell value={row.vip} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="process-section" style={{ marginTop: '40px' }}>
                <FadeIn className="center-heading">
                  <p className="eyebrow">THE PROCESS</p>
                  <h2>Simple from booking to pickup.</h2>
                </FadeIn>
                <div className="process-grid">
                  {[
                    ['01', 'Choose Your Service', 'Select the package or service your vehicle needs.'],
                    ['02', 'Tell Us About Your Vehicle', 'Share the year, make, model, size, and condition.'],
                    ['03', 'Schedule', 'Pick a preferred date and time. We confirm that window by phone or email.'],
                    ['04', 'Experience Auto Luxe', 'Drop off or request concierge service.'],
                    ['05', 'Drive Away Different', 'Leave with a vehicle ready to be noticed.'],
                  ].map(([num, title, desc], i) => (
                    <FadeIn key={num} delay={i * 80} className="process-card">
                      <span className="process-num">{num}</span>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BOOKING TAB — Jobber-style stepper + sticky estimate */}
          {activeTab === 'booking' && (
            <div className="tab-panel tab-panel-booking">
              {formSent && bookingReceipt ? (
                <div className="booking-confirm booking-confirm-page" role="status">
                  <p className="eyebrow">REQUEST RECEIVED</p>
                  <h3>We’ll confirm this window.</h3>
                  <dl>
                    <div><dt>Service</dt><dd>{bookingReceipt.service}</dd></div>
                    <div><dt>When</dt><dd>{bookingReceipt.when}</dd></div>
                    <div><dt>Where</dt><dd>{bookingReceipt.where}</dd></div>
                    {bookingReceipt.id && <div><dt>Request</dt><dd>#{String(bookingReceipt.id).slice(0, 8)}</dd></div>}
                  </dl>
                  <p>Thanks {bookingReceipt.name.split(' ')[0]}. We hold this as a request until North Splash confirms. Watch email, or call 330-990-3956.</p>
                  <button type="button" className="btn-outline" onClick={() => { setFormSent(false); setBookingReceipt(null); setBookingStep(1); }}>Book another vehicle</button>
                </div>
              ) : (
                <div className="booking-studio">
                  <div className="booking-flow">
                    <FadeIn>
                      <p className="eyebrow">REQUEST AN APPOINTMENT</p>
                      <h2>Service, vehicle, window, then your details.</h2>
                      <p className="booking-lead">The same four-step flow used by field-service bookers — with a live estimate that stays in view.</p>
                    </FadeIn>
                    <ol className="booking-steps">
                      {BOOK_STEPS.map((step) => (
                        <li key={step.n}>
                          <button
                            type="button"
                            className={`booking-step ${bookingStep === step.n ? 'is-active' : ''} ${bookingStep > step.n ? 'is-done' : ''}`}
                            onClick={() => { setBookingError(''); setBookingStep(step.n); }}
                          >
                            <span>{step.n}</span>
                            <strong>{step.label}</strong>
                            <small>{step.hint}</small>
                          </button>
                        </li>
                      ))}
                    </ol>
                    <form
                      className="booking-form"
                      onSubmit={(e) => {
                        if (bookingStep < 4) {
                          e.preventDefault();
                          advanceBooking();
                          return;
                        }
                        handleSubmit(e);
                      }}
                    >
                      {bookingStep === 1 && (
                        <div className="form-group">
                          <label>Package</label>
                          {serviceSelectGroups().map((group) => (
                            <div key={group.label} className="pkg-group">
                              <span className="pkg-group-label">{group.label}</span>
                              <div className="pkg-choices">
                                {group.items.map((p) => (
                                  <button
                                    type="button"
                                    key={p.id}
                                    className={`pkg-choice ${selectedServiceId === p.id ? 'pkg-active' : ''}`}
                                    onClick={() => setSelectedServiceId(p.id)}
                                  >
                                    <span>{p.name}</span>
                                    <strong>{money(p.price)}+</strong>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          {selectedServiceId === 'ceramic-coating' && (
                            <div className="form-group">
                              <label>Coating Term</label>
                              <div className="pkg-choices">
                                {COATING_TIERS.map((tier) => (
                                  <button
                                    type="button"
                                    key={tier.years}
                                    className={`pkg-choice ${coatingYears === tier.years ? 'pkg-active' : ''}`}
                                    onClick={() => setCoatingYears(tier.years)}
                                  >
                                    <span>{tier.label}</span>
                                    <strong>{money(tier.price)}+</strong>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {bookingStep === 2 && (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Vehicle Size</label>
                              <select value={vehicle} onChange={e => setVehicle(Number(e.target.value))}>
                                {VEHICLE_SIZES.map((v, i) => (
                                  <option key={v.name} value={i}>{v.name}{v.extra ? ` (+$${v.extra})` : ''}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Vehicle Condition</label>
                              <select value={condition} onChange={e => setCondition(e.target.value)}>
                                <option>Light</option>
                                <option>Moderate</option>
                                <option>Heavy</option>
                                <option>Severe</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Year / Make / Model</label>
                            <input placeholder="e.g. 2022 BMW M4" value={formData.vehicle} onChange={e => setFormData(p => ({...p, vehicle: e.target.value}))} />
                          </div>
                          <div className="form-group">
                            <label>Optional Add-Ons</label>
                            <div className="mini-addons">
                              {ADD_ONS.map(([name, price], i) => (
                                <button
                                  type="button"
                                  key={name}
                                  className={`mini-addon ${selectedAddOns.includes(i) ? 'mini-active' : ''}`}
                                  onClick={() => toggleAddOn(i)}
                                >
                                  {name}<span>+${price}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      {bookingStep === 3 && (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Preferred date</label>
                              <select value={formData.preferred_date} onChange={e => setFormData(p => ({...p, preferred_date: e.target.value}))}>
                                {preferredDateOptions().map((d) => (
                                  <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Preferred time</label>
                              <select value={formData.preferred_time} onChange={e => setFormData(p => ({...p, preferred_time: e.target.value}))}>
                                {BOOK_SLOTS.map((slot) => <option key={slot}>{slot}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Service location</label>
                            <input placeholder="Street, Raleigh NC 27616" value={formData.address} onChange={e => setFormData(p => ({...p, address: e.target.value}))} />
                          </div>
                        </>
                      )}
                      {bookingStep === 4 && (
                        <>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Full Name</label>
                              <input required placeholder="Full name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} />
                            </div>
                            <div className="form-group">
                              <label>Phone Number</label>
                              <input required type="tel" placeholder="919-000-0000" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Email Address</label>
                            <input required type="email" placeholder="your@email.com" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
                          </div>
                          <div className="form-group">
                            <label>Additional Notes</label>
                            <textarea rows={3} placeholder="Anything we should know about your vehicle..." value={formData.notes} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} />
                          </div>
                        </>
                      )}
                      {bookingError && <div className="booking-error" role="alert">{bookingError}</div>}
                      <div className="booking-nav">
                        {bookingStep > 1 && (
                          <button type="button" className="btn-outline" onClick={() => { setBookingError(''); setBookingStep((step) => (Math.max(1, step - 1) as BookingStep)); }}>
                            Back
                          </button>
                        )}
                        {bookingStep < 4 ? (
                          <button type="button" className="btn-primary" onClick={advanceBooking}>
                            Continue <ArrowRight size={14} />
                          </button>
                        ) : (
                          <button type="submit" className="btn-primary btn-lg" disabled={bookingSending}>
                            {bookingSending ? 'Sending…' : 'Request my appointment'}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <aside className="booking-summary">
                    <div className="estimate-box">
                      <div className="estimate-label">Live estimate</div>
                      <div className="estimate-price">{money(estimated)}</div>
                      <div className="estimate-note">Starting total · Raleigh, NC 27616</div>
                      <ul className="estimate-lines">
                        {estimateLines.map((line) => <li key={line}>{line}</li>)}
                        <li>{preferredWhen}</li>
                        {formData.address.trim() && <li>{formData.address.trim()}</li>}
                      </ul>
                      <div className="estimate-savings">
                        Saves est. {money(Math.round(estimated * 3.8))} in long-term damage
                      </div>
                    </div>
                    <div className="portal-cta-box">
                      <p>Want to track your service history and savings?</p>
                      <a href={`${OS_URL}/login?mode=signup`} className="btn-outline">Create Your Portal Account</a>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          )}

          {/* FAQ TAB — Stripe/Apple accordion with search */}
          {activeTab === 'faq' && (
            <div className="tab-panel">
              <div className="faq-studio">
                <FadeIn className="faq-heading">
                  <p className="eyebrow">FAQ</p>
                  <h2>Questions, answered.</h2>
                  <p>Search or filter, then open a row. Still stuck? Book a window or call 330-990-3956.</p>
                  <label className="faq-search">
                    <Search size={16} />
                    <input
                      type="search"
                      placeholder="Search questions"
                      value={faqQuery}
                      onChange={(e) => { setFaqQuery(e.target.value); setOpenFaq(null); }}
                    />
                  </label>
                  <div className="filter-row filter-row-light">
                    {FAQ_GROUPS.map((group) => (
                      <button
                        key={group}
                        className={`filter-btn filter-btn-light ${faqGroup === group ? 'filter-active-light' : ''}`}
                        onClick={() => { setFaqGroup(group); setOpenFaq(null); }}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </FadeIn>
                <div className="faq-list">
                  {visibleFaqs.length === 0 && (
                    <p className="gallery-empty">No matches. Try another word, or call 330-990-3956.</p>
                  )}
                  {visibleFaqs.map((item, i) => (
                    <div key={item.q} className={`faq-item ${openFaq === i ? 'faq-open' : ''}`}>
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        <span><small>{item.group}</small>{item.q}</span>
                        {openFaq === i ? <Minus size={16} /> : <Plus size={16} />}
                      </button>
                      <div className="faq-answer">
                        <p>{item.a}</p>
                      </div>
                    </div>
                  ))}
                  <div className="faq-cta">
                    <p>Still have a question?</p>
                    <button type="button" className="btn-primary" onClick={() => openTab('booking')}>Book a window</button>
                    <a className="btn-outline" href="tel:3309903956">Call 330-990-3956</a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* REVIEWS - always visible */}
      <section id="reviews" className="reviews-section">
        <FadeIn className="reviews-heading">
          <p className="eyebrow">CLIENT EXPERIENCE</p>
          <h2>Built to earn the<br /><em>five-star feeling.</em></h2>
          <p>
            Great detailing should be easy to notice and easy to remember. This space is ready for verified
            North Splash customer reviews as they are collected.
          </p>
        </FadeIn>

        <div className="reviews-grid">
          <FadeIn className="review-card review-card-featured" delay={80}>
            <div className="review-stars" aria-label="Five star standard">
              {[0, 1, 2, 3, 4].map(i => <Star key={i} size={18} fill="currentColor" />)}
            </div>
            <span className="review-kicker">YOUR EXPERIENCE MATTERS</span>
            <h3>Already detailed by North Splash?</h3>
            <p>
              Tell us what stood out — the finish, convenience, communication, or overall service. We only want
              real customer feedback shown here.
            </p>
            <a
              className="review-action"
              href="mailto:support@northsplash.com?subject=North%20Splash%20Auto%20Luxe%20Review"
            >
              Share your review <ArrowRight size={14} />
            </a>
          </FadeIn>

          <FadeIn className="review-card" delay={160}>
            <div className="review-number">01</div>
            <span className="review-kicker">QUALITY</span>
            <h3>Finish-first service</h3>
            <p>Every package is designed around visible results, careful workmanship, and protection that fits the vehicle.</p>
          </FadeIn>

          <FadeIn className="review-card" delay={240}>
            <div className="review-number">02</div>
            <span className="review-kicker">CONVENIENCE</span>
            <h3>Mobile by design</h3>
            <p>Book the service you need and let North Splash bring the detailing experience to you.</p>
          </FadeIn>
        </div>
      </section>

      {/* CONTACT - always visible at bottom */}
      <section id="contact" className="contact-section">
        <FadeIn className="contact-left">
          <p className="eyebrow eyebrow-glow">NORTH SPLASH AUTO LUXE</p>
          <h2>Your vehicle.<br /><em>Our standard.</em></h2>
          <p>Ready to elevate the finish? We service Raleigh, NC 27616 and nearby Wake County.</p>
        </FadeIn>
        <FadeIn delay={150} className="contact-right">
          <a href="tel:3309903956" className="contact-link">330-990-3956</a>
          <span className="contact-link">Raleigh, NC 27616</span>
          <a href="mailto:support@northsplash.com" className="contact-link">support@northsplash.com</a>
          <button className="btn-white" onClick={() => scrollTo('booking')}>Book Auto Luxe</button>
        </FadeIn>
      </section>

      <Footer onScrollTo={scrollTo} />
    </div>
  );
}

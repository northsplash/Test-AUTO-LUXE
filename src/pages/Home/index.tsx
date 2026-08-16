import { useMemo, useState, useEffect, useRef } from 'react';
import {
  ChevronDown, Check, Plus, Minus, ArrowRight, Sparkles, Shield, Star, Zap,
  Car, Package, Gem, Camera, Crown, Calendar, HelpCircle, ArrowLeft
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { SERVICES, PACKAGES, MEMBERSHIPS, ADD_ONS, VEHICLE_SIZES, FAQS, money } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { trackPageView } from '@/lib/auth';

const OS_URL = (import.meta.env.VITE_OS_URL || 'https://app.northsplash.com').replace(/\/$/, '');

type TabId = 'services' | 'packages' | 'protection' | 'gallery' | 'membership' | 'booking' | 'faq';

const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: 'services', label: 'Services', Icon: Car },
  { id: 'packages', label: 'Packages', Icon: Package },
  { id: 'protection', label: 'Protection', Icon: Gem },
  { id: 'gallery', label: 'Gallery', Icon: Camera },
  { id: 'membership', label: 'Membership', Icon: Crown },
  { id: 'booking', label: 'Book', Icon: Calendar },
  { id: 'faq', label: 'FAQ', Icon: HelpCircle },
];

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollAnimation();
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(32px)',
        transition: `opacity 0.8s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.8s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [serviceFilter, setServiceFilter] = useState('All');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(1);
  const [vehicle, setVehicle] = useState(0);
  const [condition, setCondition] = useState('Light');
  const [selectedAddOns, setSelectedAddOns] = useState<number[]>([]);
  const [formSent, setFormSent] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSending, setBookingSending] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', vehicle: '', notes: '' });
  const [heroVisible, setHeroVisible] = useState(false);
  const [counterVal, setCounterVal] = useState(0);
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    trackPageView('/').catch(() => {});
  }, []);

  useEffect(() => {
    if (heroVisible) {
      const target = 500;
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
    } else if (id === 'contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveTab(id as TabId);
      setTimeout(() => tabRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const estimated = useMemo(() => {
    const base = PACKAGES[selectedPackage].price;
    const size = VEHICLE_SIZES[vehicle].extra;
    const condExtra = condition === 'Moderate' ? 35 : condition === 'Heavy' ? 75 : condition === 'Severe' ? 125 : 0;
    const extras = selectedAddOns.reduce((sum, i) => sum + ADD_ONS[i][1], 0);
    return base + size + condExtra + extras;
  }, [selectedPackage, vehicle, condition, selectedAddOns]);

  const toggleAddOn = (i: number) => {
    setSelectedAddOns(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i]);
  };

  const filtered = serviceFilter === 'All' ? SERVICES : SERVICES.filter(s => s.category === serviceFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('public-booking', {
        body: {
          customer_name: formData.name.trim(),
          customer_email: formData.email.trim(),
          customer_phone: formData.phone.trim(),
          service_name: PACKAGES[selectedPackage].name,
          package_name: PACKAGES[selectedPackage].name,
          add_ons: selectedAddOns.map(i => ADD_ONS[i][0]),
          vehicle_info: formData.vehicle.trim(),
          price: estimated,
          notes: formData.notes.trim(),
          source_channel: 'northsplash.com',
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Unable to submit booking.');
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
      <Navigation onScrollTo={scrollTo} isHomePage />

      {/* HERO */}
      <section id="home" className="hero">
        <div className="hero-bg">
          <img src="https://images.pexels.com/photos/33345481/pexels-photo-33345481.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="Luxury vehicle" />
          <div className="hero-gradient" />
          <div className="hero-noise" />
        </div>

        <div className={`hero-content ${heroVisible ? 'hero-visible' : ''}`}>
          <p className="eyebrow eyebrow-glow">PREMIUM AUTOMOTIVE CARE</p>
          <h1 className="hero-title">
            Elevate<br />
            <em>Your Drive.</em>
          </h1>
          <p className="hero-copy">
            A higher standard of vehicle care. Precision detailing, paint enhancement, ceramic protection, and concierge service designed for the way your vehicle deserves to look.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => scrollTo('booking')}>
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
        <FadeIn delay={150} className="intro-right">
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
            <FadeIn className="teaser-card" delay={0}>
              <div className="teaser-img">
                <img src={SERVICES[0].image} alt="Services" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Car size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">SERVICES</p>
                <h3>Care without shortcuts</h3>
                <p>From exterior refresh to full paint transformation. {SERVICES.length} services starting at {money(SERVICES[0].price)}.</p>
                <button className="teaser-link" onClick={() => openTab('services')}>
                  View services <ArrowRight size={13} />
                </button>
              </div>
            </FadeIn>

            {/* Packages teaser */}
            <FadeIn className="teaser-card" delay={80}>
              <div className="teaser-img">
                <img src={SERVICES[2].image} alt="Packages" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Package size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">PACKAGES</p>
                <h3>Choose your level of Luxe</h3>
                <p>Three signature packages from {money(PACKAGES[0].price)} to {money(PACKAGES[2].price)}. Simple pricing, premium results.</p>
                <button className="teaser-link" onClick={() => openTab('packages')}>
                  Compare packages <ArrowRight size={13} />
                </button>
              </div>
            </FadeIn>

            {/* Protection teaser */}
            <FadeIn className="teaser-card" delay={160}>
              <div className="teaser-img">
                <img src={SERVICES[4].image} alt="Protection" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Gem size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">PROTECTION</p>
                <h3>Built to protect</h3>
                <p>Ceramic coating in 1, 3, and 5-year tiers. Hydrophobic protection with deeper gloss.</p>
                <button className="teaser-link" onClick={() => openTab('protection')}>
                  Explore protection <ArrowRight size={13} />
                </button>
              </div>
            </FadeIn>

            {/* Gallery teaser */}
            <FadeIn className="teaser-card" delay={0}>
              <div className="teaser-img">
                <img src={SERVICES[3].image} alt="Gallery" />
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
            </FadeIn>

            {/* Membership teaser */}
            <FadeIn className="teaser-card" delay={80}>
              <div className="teaser-img">
                <img src={SERVICES[1].image} alt="Membership" />
                <div className="teaser-overlay" />
                <div className="teaser-icon"><Crown size={22} /></div>
              </div>
              <div className="teaser-body">
                <p className="eyebrow">MEMBERSHIP</p>
                <h3>Don't wait until it needs rescuing</h3>
                <p>Three maintenance plans from {money(MEMBERSHIPS[0].price)}/mo to {money(MEMBERSHIPS[2].price)}/mo. Consistency pays.</p>
                <button className="teaser-link" onClick={() => openTab('membership')}>
                  See plans <ArrowRight size={13} />
                </button>
              </div>
            </FadeIn>

            {/* Booking teaser */}
            <FadeIn className="teaser-card teaser-cta" delay={160}>
              <div className="teaser-body teaser-body-cta">
                <p className="eyebrow">BOOK NOW</p>
                <h3>Get an instant estimate</h3>
                <p>Build your service, pick your add-ons, and request your appointment in minutes.</p>
                <button className="btn-primary" onClick={() => openTab('booking')}>
                  Book Your Detail <ArrowRight size={14} />
                </button>
              </div>
            </FadeIn>
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

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="tab-panel">
              <FadeIn className="section-header dark-header">
                <div>
                  <p className="eyebrow eyebrow-dim">SERVICES</p>
                  <h2>Care without shortcuts.</h2>
                </div>
                <p>From a polished daily driver to a full paint transformation.</p>
              </FadeIn>
              <div className="filter-row">
                {['All', 'Detail', 'Paint', 'Ceramic'].map(f => (
                  <button key={f} className={`filter-btn ${serviceFilter === f ? 'filter-active' : ''}`} onClick={() => setServiceFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="service-grid">
                {filtered.map((s, i) => (
                  <FadeIn key={s.title} delay={i * 80} className="service-card">
                    <div className="service-img">
                      <img src={s.image} alt={s.title} />
                      <div className="service-img-overlay" />
                      <span className="service-badge">{s.category}</span>
                    </div>
                    <div className="service-body">
                      <div className="service-top">
                        <h3>{s.title}</h3>
                        <strong className="service-price">{money(s.price)}<sup>+</sup></strong>
                      </div>
                      <p>{s.desc}</p>
                      <ul>
                        {s.items.map(item => <li key={item}><Check size={11} /> {item}</li>)}
                      </ul>
                      <button className="service-cta" onClick={() => openTab('booking')}>
                        Book this service <ArrowRight size={13} />
                      </button>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          )}

          {/* PACKAGES TAB */}
          {activeTab === 'packages' && (
            <div className="tab-panel">
              <FadeIn className="center-heading">
                <p className="eyebrow">SIGNATURE PACKAGES</p>
                <h2>Choose your level of Luxe.</h2>
                <p>Simple starting prices. Personalized service. A finish that speaks for itself.</p>
              </FadeIn>
              <div className="packages-grid">
                {PACKAGES.map((p, i) => (
                  <FadeIn key={p.name} delay={i * 100} className={`package-card ${p.featured ? 'package-featured' : ''}`}>
                    <span className="package-tag">{p.tag}</span>
                    {p.featured && <div className="package-glow" />}
                    <h3>{p.name}</h3>
                    <div className="package-price">{money(p.price)}<sup>+</sup></div>
                    <p>{p.desc}</p>
                    <ul>
                      {p.features.map(f => <li key={f}><Check size={12} /> {f}</li>)}
                    </ul>
                    <button
                      className={p.featured ? 'btn-primary btn-full' : 'btn-dark btn-full'}
                      onClick={() => { setSelectedPackage(i); openTab('booking'); }}
                    >
                      Choose {p.name}
                    </button>
                  </FadeIn>
                ))}
              </div>
              <FadeIn className="pricing-note">
                <strong>Vehicle-size pricing:</strong> Sedan/Coupe +$0 · Small SUV +$25 · Large SUV/Truck +$50 · Three-Row/Large Truck +$75. Final pricing may vary by condition.
              </FadeIn>
            </div>
          )}

          {/* PROTECTION TAB */}
          {activeTab === 'protection' && (
            <div className="tab-panel">
              <div className="protection-section">
                <FadeIn className="protection-left" direction="left">
                  <img src={SERVICES[4].image} alt="Ceramic coating" />
                  <div className="protection-img-accent" />
                </FadeIn>
                <FadeIn className="protection-right" delay={150}>
                  <p className="eyebrow">LUXE PROTECTION</p>
                  <h2>More than shine.<br /><em>Built to protect.</em></h2>
                  <p>Our ceramic coating service combines meticulous preparation with long-lasting hydrophobic protection. The result is deeper gloss, easier maintenance, and a finish built for the road.</p>
                  <div className="protection-tiers">
                    {[['1 YEAR', 650], ['3 YEAR', 950], ['5 YEAR', 1250]].map(([label, price]) => (
                      <div key={String(label)} className="protection-tier">
                        <span>{label}</span>
                        <strong>{money(Number(price))}<sup>+</sup></strong>
                      </div>
                    ))}
                  </div>
                  <button className="btn-dark" onClick={() => openTab('booking')}>Request Coating Quote</button>
                </FadeIn>
              </div>

              <div className="addons-section" style={{ background: 'var(--black)', padding: '80px 7vw', marginTop: '0' }}>
                <FadeIn className="section-header dark-header">
                  <div>
                    <p className="eyebrow eyebrow-dim">LUXE ADD-ONS</p>
                    <h2>Make it yours.</h2>
                  </div>
                  <p>Build your service around what your vehicle actually needs.</p>
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

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="tab-panel">
              <FadeIn className="center-heading">
                <p className="eyebrow">THE LUXE COLLECTION</p>
                <h2>Made to be seen.</h2>
                <p>Premium vehicles. Precise finishes. Attention to the details that change the whole look.</p>
              </FadeIn>
              <div className="gallery-grid">
                <div className="gallery-cell gallery-main">
                  <img src={SERVICES[2].image} alt="Luxe signature detail" />
                  <div className="gallery-caption">Signature Detail</div>
                </div>
                <div className="gallery-cell">
                  <img src={SERVICES[1].image} alt="Interior detail" />
                  <div className="gallery-caption">Interior Care</div>
                </div>
                <div className="gallery-cell">
                  <img src={SERVICES[3].image} alt="Paint correction" />
                  <div className="gallery-caption">Paint Correction</div>
                </div>
                <div className="gallery-cell gallery-wide">
                  <img src={SERVICES[4].image} alt="Ceramic coating" />
                  <div className="gallery-caption">Ceramic Coating</div>
                </div>
                <div className="gallery-cell">
                  <img src={SERVICES[0].image} alt="Exterior detail" />
                  <div className="gallery-caption">Exterior Detail</div>
                </div>
              </div>

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

          {/* MEMBERSHIP TAB */}
          {activeTab === 'membership' && (
            <div className="tab-panel">
              <FadeIn className="center-heading">
                <p className="eyebrow">LUXE MEMBERSHIP</p>
                <h2>Don't wait until your car needs rescuing.</h2>
                <p>Keep the finish you love with a maintenance plan built around consistency.</p>
              </FadeIn>
              <div className="membership-grid">
                {MEMBERSHIPS.map((plan, i) => (
                  <FadeIn key={plan.name} delay={i * 100} className="membership-card">
                    <p className="eyebrow">{plan.name.toUpperCase()}</p>
                    <div className="member-price">
                      {money(plan.price)}<small>/month</small>
                    </div>
                    <p>{plan.desc}</p>
                    <ul>
                      {plan.features.map(f => <li key={f}><Check size={11} /> {f}</li>)}
                    </ul>
                    <div className="member-savings-badge">
                      <Shield size={12} /> {plan.savings}
                    </div>
                    <a href={`${OS_URL}/login?mode=signup`} className="btn-outline btn-full">Join {plan.name}</a>
                  </FadeIn>
                ))}
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
                    ['03', 'Schedule', 'Choose your preferred appointment date and time.'],
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

          {/* BOOKING TAB */}
          {activeTab === 'booking' && (
            <div className="tab-panel">
              <div className="booking-section">
                <FadeIn className="booking-left">
                  <p className="eyebrow">BUILD YOUR LUXE SERVICE</p>
                  <h2>Get an instant starting estimate.</h2>
                  <p>Select a package, vehicle size, condition, and optional add-ons.</p>
                  <div className="estimate-box">
                    <div className="estimate-label">Estimated Starting Total</div>
                    <div className="estimate-price">{money(estimated)}</div>
                    <div className="estimate-note">Before custom-service adjustments</div>
                    <div className="estimate-savings">
                      Saves est. {money(Math.round(estimated * 3.8))} in long-term damage
                    </div>
                  </div>
                  <div className="portal-cta-box">
                    <p>Want to track your service history and savings?</p>
                    <a href={`${OS_URL}/login?mode=signup`} className="btn-outline">Create Your Portal Account</a>
                  </div>
                </FadeIn>

                <FadeIn delay={150} className="booking-right">
                  <form className="booking-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label>Package</label>
                      <div className="pkg-choices">
                        {PACKAGES.map((p, i) => (
                          <button
                            type="button"
                            key={p.name}
                            className={`pkg-choice ${selectedPackage === i ? 'pkg-active' : ''}`}
                            onClick={() => setSelectedPackage(i)}
                          >
                            <span>{p.name}</span>
                            <strong>{money(p.price)}+</strong>
                          </button>
                        ))}
                      </div>
                    </div>
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
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input required placeholder="Full name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input required type="tel" placeholder="330-000-0000" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email Address</label>
                        <input required type="email" placeholder="your@email.com" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
                      </div>
                      <div className="form-group">
                        <label>Year / Make / Model</label>
                        <input placeholder="e.g. 2022 BMW M4" value={formData.vehicle} onChange={e => setFormData(p => ({...p, vehicle: e.target.value}))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Additional Notes</label>
                      <textarea rows={3} placeholder="Anything we should know about your vehicle..." value={formData.notes} onChange={e => setFormData(p => ({...p, notes: e.target.value}))} />
                    </div>
                    {bookingError && <div className="booking-error" role="alert">{bookingError}</div>}
                    <button type="submit" className="btn-primary btn-full btn-lg" disabled={formSent || bookingSending}>
                      {formSent ? '✓ Request Submitted' : bookingSending ? 'Sending…' : 'Request My Appointment'}
                    </button>
                    {formSent && (
                      <p className="form-success">Your request has been submitted. We'll be in touch shortly.</p>
                    )}
                  </form>
                </FadeIn>
              </div>
            </div>
          )}

          {/* FAQ TAB */}
          {activeTab === 'faq' && (
            <div className="tab-panel">
              <div className="faq-section" style={{ padding: '0 7vw', display: 'grid', gridTemplateColumns: '0.6fr 1.4fr', gap: '8vw' }}>
                <FadeIn className="faq-heading">
                  <p className="eyebrow">FAQ</p>
                  <h2>Questions, answered.</h2>
                </FadeIn>
                <div className="faq-list">
                  {FAQS.map(([q, a], i) => (
                    <div key={q} className={`faq-item ${openFaq === i ? 'faq-open' : ''}`}>
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        <span>{q}</span>
                        {openFaq === i ? <Minus size={16} /> : <Plus size={16} />}
                      </button>
                      <div className="faq-answer">
                        <p>{a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* CONTACT - always visible at bottom */}
      <section id="contact" className="contact-section">
        <FadeIn className="contact-left">
          <p className="eyebrow eyebrow-glow">NORTH SPLASH AUTO LUXE</p>
          <h2>Your vehicle.<br /><em>Our standard.</em></h2>
          <p>Ready to elevate the finish? Let's build the right service for your vehicle.</p>
        </FadeIn>
        <FadeIn delay={150} className="contact-right">
          <a href="tel:3309903956" className="contact-link">330-990-3956</a>
          <a href="mailto:support@northsplash.com" className="contact-link">support@northsplash.com</a>
          <button className="btn-white" onClick={() => scrollTo('booking')}>Book Auto Luxe</button>
        </FadeIn>
      </section>

      <Footer onScrollTo={scrollTo} />
    </div>
  );
}

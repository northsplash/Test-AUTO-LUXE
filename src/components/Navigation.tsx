import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';

type Props = { onScrollTo?: (id: string) => void; isHomePage?: boolean };
const OS_URL = 'https://ns-auto-luxe-os.vercel.app';

const LINKS: { id: string; label: string }[] = [
  { id: 'services', label: 'Services' },
  { id: 'packages', label: 'Packages' },
  { id: 'protection', label: 'Protection' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'membership', label: 'Membership' },
  { id: 'faq', label: 'FAQ' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'contact', label: 'Contact' },
];

export function Navigation({ onScrollTo, isHomePage }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('site-menu-open', menuOpen);
    return () => document.body.classList.remove('site-menu-open');
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    if (isHomePage && onScrollTo) onScrollTo(id);
    else navigate({ pathname: '/', hash: id });
  };

  return (
    <header className={`nav-header ${scrolled ? 'nav-scrolled' : ''}`}>
      <a className="skip-to-content" href="#main">Skip to content</a>
      <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
        <img className="nav-logo-image" src="/ns-auto-luxe-full-logo.png" alt="North Splash Auto Luxe Premium Detailing" />
      </Link>
      <nav aria-label="Primary navigation" className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
        {LINKS.map((link) => (
          <button type="button" key={link.id} onClick={() => go(link.id)}>{link.label}</button>
        ))}
        <div className="mobile-menu-actions">
          <a href={`${OS_URL}/login`}>Portal Login</a>
          <Link to="/apply" onClick={() => setMenuOpen(false)}>Apply for a job</Link>
          <button type="button" onClick={() => go('booking')}>Book Your Detail</button>
        </div>
      </nav>
      <div className="nav-right">
        <a className="nav-cta" href={`${OS_URL}/login`}><LogIn size={15} /> Portal</a>
        <button type="button" className="nav-book" onClick={() => go('booking')}>Book Now</button>
        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

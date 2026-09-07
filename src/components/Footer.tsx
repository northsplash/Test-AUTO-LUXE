import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { MARKET } from '@/lib/market';

const OS_URL = 'https://ns-auto-luxe-os.vercel.app';

type Props = {
  onScrollTo?: (id: string) => void;
};

export function Footer({ onScrollTo }: Props) {
  const { pathname } = useLocation();
  const scroll = (id: string) => {
    if (onScrollTo) onScrollTo(id);
    else window.location.assign(`/#${id}`);
  };

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand-col">
          <div className="footer-brand">
            <img className="footer-logo-image" src="/ns-auto-luxe-full-logo.png" alt="North Splash Auto Luxe Premium Detailing"/>
          </div>
          <p>Premium automotive care all over North Carolina. Built around the finish that lasts.</p>
        </div>

        <div className="footer-col">
          <h4>Services</h4>
          <button type="button" onClick={() => scroll('services')}>Exterior Detail</button>
          <button type="button" onClick={() => scroll('services')}>Interior Detail</button>
          <button type="button" onClick={() => scroll('packages')}>Full Vehicle Detail</button>
          <button type="button" onClick={() => scroll('services')}>Paint Correction</button>
          <button type="button" onClick={() => scroll('protection')}>Ceramic Coating</button>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <button type="button" onClick={() => scroll('packages')}>Packages</button>
          <button type="button" onClick={() => scroll('membership')}>Membership</button>
          <button type="button" onClick={() => scroll('faq')}>FAQ</button>
          <button type="button" onClick={() => scroll('reviews')}>Reviews</button>
          <Link to="/apply">Careers</Link>
          <a href={`${OS_URL}/login`}>Customer Portal</a>
          <a href={`${OS_URL}/login`}>Sign In</a>
          <a href={`${OS_URL}/login?mode=signup`}>Create Account</a>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <span className="footer-contact">
            <MapPin size={13} /> {MARKET.region}
          </span>
          <a href={`tel:${MARKET.phoneTel}`} className="footer-contact">
            <Phone size={13} /> {MARKET.phone}
          </a>
          <a href={`mailto:${MARKET.email}`} className="footer-contact">
            <Mail size={13} /> {MARKET.email}
          </a>
        </div>
      </div>

      {pathname !== '/apply' && (
        <div className="footer-apply">
          <div>
            <strong>Hiring in North Carolina</strong>
            <p>Mobile detailers, door-to-door sales, and concierge ops. Real questions, about ten minutes, no account.</p>
          </div>
          <Link to="/apply" className="footer-apply-btn">Apply for a job</Link>
        </div>
      )}

      <div className="footer-bottom">
        <small>© 2026 North Splash Auto Luxe. All rights reserved.</small>
        <small><a className="footer-powered" href="https://northsplash.shop" target="_blank" rel="noopener noreferrer">Powered by NS Venture Works</a></small>
      </div>
    </footer>
  );
}

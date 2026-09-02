import { Phone, Mail, Instagram, Facebook } from 'lucide-react';

const OS_URL = 'https://ns-auto-luxe-os.vercel.app';

type Props = {
  onScrollTo?: (id: string) => void;
};

export function Footer({ onScrollTo }: Props) {
  const scroll = (id: string) => onScrollTo?.(id);

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand-col">
          <div className="footer-brand">
            <div className="brand-mark brand-mark-sm">NS</div>
            <div>
              <strong>NORTH SPLASH</strong>
              <small>AUTO LUXE</small>
            </div>
          </div>
          <p>Premium automotive care. Built around the finish that lasts.</p>
          <div className="footer-social">
            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <Instagram size={16} />
            </a>
            <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <Facebook size={16} />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Services</h4>
          <button onClick={() => scroll('services')}>Exterior Detail</button>
          <button onClick={() => scroll('services')}>Interior Detail</button>
          <button onClick={() => scroll('services')}>Paint Correction</button>
          <button onClick={() => scroll('services')}>Ceramic Coating</button>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <button onClick={() => scroll('packages')}>Packages</button>
          <button onClick={() => scroll('membership')}>Membership</button>
          <button onClick={() => scroll('reviews')}>Reviews</button>
          <a href={`${OS_URL}/login`}>Customer Portal</a>
          <a href={`${OS_URL}/login`}>Sign In</a>
          <a href={`${OS_URL}/login?mode=signup`}>Create Account</a>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <a href="tel:3309903956" className="footer-contact">
            <Phone size={13} /> 330-990-3956
          </a>
          <a href="mailto:support@northsplash.com" className="footer-contact">
            <Mail size={13} /> support@northsplash.com
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <small>© 2026 North Splash Auto Luxe. All rights reserved.</small>
        <small><a className="footer-powered" href="https://northsplash.shop" target="_blank" rel="noopener noreferrer">Powered by NS Venture Works</a></small>
      </div>
    </footer>
  );
}


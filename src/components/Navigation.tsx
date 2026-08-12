import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';

type Props = {
  onScrollTo?: (id: string) => void;
  isHomePage?: boolean;
};

export function Navigation({ onScrollTo, isHomePage }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleNav = (id: string) => {
    setMenuOpen(false);
    if (isHomePage && onScrollTo) {
      onScrollTo(id);
    } else {
      navigate(`/#${id}`);
    }
  };

  const handleSignOut = async () => {
    await signOut().catch(() => {});
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`nav-header ${scrolled ? 'nav-scrolled' : ''}`}
    >
      <Link to="/" className="nav-brand">
        <div className="brand-mark">NS</div>
        <div>
          <strong>NORTH SPLASH</strong>
          <small>AUTO LUXE</small>
        </div>
      </Link>

      <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
        <button onClick={() => handleNav('services')}>Services</button>
        <button onClick={() => handleNav('packages')}>Packages</button>
        <button onClick={() => handleNav('protection')}>Protection</button>
        <button onClick={() => handleNav('membership')}>Membership</button>
        <button onClick={() => handleNav('contact')}>Contact</button>
      </nav>

      <div className="nav-right">
        {user ? (
          <div className="profile-menu">
            <button
              className="profile-trigger"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="profile-avatar">
                {profile?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <ChevronDown size={14} />
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <p>{profile?.full_name ?? 'Customer'}</p>
                  <small>{user.email}</small>
                </div>
                <Link to="/portal" onClick={() => setProfileOpen(false)}>
                  <User size={14} /> My Portal
                </Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setProfileOpen(false)}>
                    <Settings size={14} /> Admin
                  </Link>
                )}
                <button onClick={handleSignOut}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="nav-cta">Sign In</Link>
        )}
        <button
          className="nav-book"
          onClick={() => handleNav('booking')}
        >
          Book Now
        </button>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {profileOpen && (
        <div className="profile-backdrop" onClick={() => setProfileOpen(false)} />
      )}
    </header>
  );
}

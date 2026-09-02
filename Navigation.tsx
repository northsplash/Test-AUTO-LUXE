import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';

type Props = { onScrollTo?: (id: string) => void; isHomePage?: boolean };
const OS_URL = 'https://ns-auto-luxe-os.vercel.app';

export function Navigation({ onScrollTo, isHomePage }: Props) {
  const [menuOpen,setMenuOpen]=useState(false); const [scrolled,setScrolled]=useState(false); const navigate=useNavigate();
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>50);window.addEventListener('scroll',fn,{passive:true});return()=>window.removeEventListener('scroll',fn)},[]);
  const go=(id:string)=>{setMenuOpen(false); if(isHomePage&&onScrollTo) onScrollTo(id); else navigate(`/#${id}`)};
  return <header className={`nav-header ${scrolled?'nav-scrolled':''}`}>
    <Link to="/" className="nav-brand"><img className="nav-logo-image" src="/ns-auto-luxe-logo.png" alt="North Splash Auto Luxe"/><div className="nav-brand-copy"><strong>NORTH SPLASH</strong><small>AUTO LUXE</small></div></Link>
    <nav className={`nav-links ${menuOpen?'nav-open':''}`}><button onClick={()=>go('services')}>Services</button><button onClick={()=>go('packages')}>Packages</button><button onClick={()=>go('protection')}>Protection</button><button onClick={()=>go('membership')}>Membership</button><button onClick={()=>go('reviews')}>Reviews</button><button onClick={()=>go('contact')}>Contact</button></nav>
    <div className="nav-right"><a className="nav-cta" href={`${OS_URL}/login`}><LogIn size={15}/> Portal</a><button className="nav-book" onClick={()=>go('booking')}>Book Now</button><button className="menu-toggle" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X size={22}/>:<Menu size={22}/>}</button></div>
  </header>;
}

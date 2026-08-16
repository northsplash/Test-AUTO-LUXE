import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Eye, House, KeyRound, MapPin, RefreshCw } from 'lucide-react';

type StreetViewHouse = {
  id?: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  status?: string | null;
  source?: string | null;
};

type Props = {
  houses: StreetViewHouse[];
  activeHouse?: StreetViewHouse | null;
  onActiveHouseChange?: (house: StreetViewHouse) => void;
};

declare global {
  interface Window {
    google?: any;
    __northSplashGoogleMapsPromise?: Promise<any>;
  }
}

const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (window.__northSplashGoogleMapsPromise) return window.__northSplashGoogleMapsPromise;
  if (!GOOGLE_MAPS_KEY) return Promise.reject(new Error('GOOGLE_MAPS_KEY_MISSING'));

  window.__northSplashGoogleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ns-google-maps="true"]');
    if (existing) {
      const wait = window.setInterval(() => {
        if (window.google?.maps) {
          window.clearInterval(wait);
          resolve(window.google.maps);
        }
      }, 80);
      window.setTimeout(() => {
        window.clearInterval(wait);
        if (!window.google?.maps) reject(new Error('Google Maps failed to load.'));
      }, 12000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.nsGoogleMaps = 'true';
    script.onload = () => window.google?.maps ? resolve(window.google.maps) : reject(new Error('Google Maps failed to initialize.'));
    script.onerror = () => reject(new Error('Google Maps failed to load.'));
    document.head.appendChild(script);
  });

  return window.__northSplashGoogleMapsPromise;
}

function externalStreetViewUrl(house?: StreetViewHouse | null) {
  if (!house) return 'https://maps.google.com/';
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${house.latitude},${house.longitude}`;
}

export default function TerritoryStreetView({ houses, activeHouse, onActiveHouseChange }: Props) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<any>(null);
  const serviceRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [internalActive, setInternalActive] = useState<StreetViewHouse | null>(activeHouse || houses[0] || null);

  useEffect(() => {
    if (activeHouse) setInternalActive(activeHouse);
    else if (!internalActive && houses.length) setInternalActive(houses[0]);
  }, [activeHouse, houses, internalActive]);

  const current = activeHouse || internalActive || houses[0] || null;
  const currentIndex = useMemo(() => {
    if (!current) return -1;
    return houses.findIndex(h => (h.id && current.id ? h.id === current.id : h.latitude === current.latitude && h.longitude === current.longitude));
  }, [houses, current]);

  const selectHouse = (house: StreetViewHouse) => {
    setInternalActive(house);
    onActiveHouseChange?.(house);
  };

  const shiftHouse = (delta: number) => {
    if (!houses.length) return;
    const index = currentIndex < 0 ? 0 : currentIndex;
    const next = houses[(index + delta + houses.length) % houses.length];
    if (next) selectHouse(next);
  };

  const positionPanorama = async (house: StreetViewHouse) => {
    if (!viewerRef.current) return;
    setLoading(true);
    setError('');
    setAvailable(null);
    try {
      const maps = await loadGoogleMaps();
      serviceRef.current ||= new maps.StreetViewService();
      const location = { lat: Number(house.latitude), lng: Number(house.longitude) };
      const response = await serviceRef.current.getPanorama({ location, radius: 90, preference: maps.StreetViewPreference.NEAREST, source: maps.StreetViewSource.OUTDOOR });
      const panoLocation = response?.data?.location?.latLng || location;
      if (!panoramaRef.current) {
        panoramaRef.current = new maps.StreetViewPanorama(viewerRef.current, {
          position: panoLocation,
          pov: { heading: 0, pitch: 0 },
          zoom: 1,
          addressControl: true,
          fullscreenControl: true,
          motionTracking: false,
          motionTrackingControl: false,
          linksControl: true,
          panControl: true,
          zoomControl: true,
          enableCloseButton: false,
        });
      } else {
        panoramaRef.current.setPosition(panoLocation);
        panoramaRef.current.setVisible(true);
      }
      setAvailable(true);
    } catch (err: any) {
      setAvailable(false);
      setError(err?.message === 'GOOGLE_MAPS_KEY_MISSING'
        ? 'Add VITE_GOOGLE_MAPS_API_KEY in Vercel to enable the interactive 360° viewer.'
        : 'Street View imagery was not available near this property.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !current) return;
    const timer = window.setTimeout(() => positionPanorama(current), 60);
    return () => window.clearTimeout(timer);
  }, [open, current?.id, current?.latitude, current?.longitude]);

  return (
    <section className={`territory-streetview ${open ? 'is-open' : ''}`}>
      <button type="button" className="territory-streetview-toggle" onClick={() => setOpen(v => !v)}>
        <span className="streetview-toggle-icon"><Eye size={19} /></span>
        <span>
          <small>PROPERTY REVIEW</small>
          <strong>{open ? 'Hide Street View' : 'Check Street View'}</strong>
          <em>{houses.length ? `${houses.length} mapped ${houses.length === 1 ? 'house' : 'houses'} ready to inspect` : 'Load or preview houses to inspect the street'}</em>
        </span>
        <span className="streetview-toggle-action">{open ? 'Close' : 'Open viewer'} <ChevronRight size={17} /></span>
      </button>

      {open && (
        <div className="territory-streetview-body">
          <header className="territory-streetview-head">
            <div>
              <span className="eyebrow">INTERACTIVE 360° PROPERTY VIEW</span>
              <h3>{current?.address || 'Choose a mapped house'}</h3>
              <p>Move through the street inside North Splash, then switch houses without leaving Territory Command.</p>
            </div>
            <div className="streetview-house-nav">
              <button type="button" className="btn-outline" disabled={!houses.length} onClick={() => shiftHouse(-1)}><ChevronLeft size={15}/>Previous House</button>
              <span>{currentIndex >= 0 ? currentIndex + 1 : 0} / {houses.length}</span>
              <button type="button" className="btn-outline" disabled={!houses.length} onClick={() => shiftHouse(1)}>Next House<ChevronRight size={15}/></button>
            </div>
          </header>

          <div className="territory-streetview-grid">
            <div className="streetview-viewer-shell">
              <div ref={viewerRef} className="streetview-viewer" />
              {!current && <div className="streetview-overlay"><House size={34}/><strong>No house selected</strong><span>Preview or load houses first.</span></div>}
              {current && loading && <div className="streetview-overlay"><RefreshCw className="spin" size={28}/><strong>Finding nearest Street View…</strong><span>{current.address || `${current.latitude.toFixed(5)}, ${current.longitude.toFixed(5)}`}</span></div>}
              {current && !loading && available === false && <div className="streetview-overlay streetview-error"><KeyRound size={28}/><strong>Interactive Street View unavailable</strong><span>{error}</span><a className="btn-primary" target="_blank" rel="noreferrer" href={externalStreetViewUrl(current)}>Open in Google Maps <ExternalLink size={14}/></a></div>}
            </div>

            <aside className="streetview-house-list">
              <div className="streetview-house-list-head">
                <div><strong>Territory Houses</strong><small>Click a property to move Street View</small></div>
                <span>{houses.length}</span>
              </div>
              <div className="streetview-house-scroll">
                {houses.length === 0 && <div className="ns-empty compact">No mapped houses yet.</div>}
                {houses.slice(0, 250).map((house, index) => {
                  const active = current && (house.id && current.id ? house.id === current.id : house.latitude === current.latitude && house.longitude === current.longitude);
                  return <button type="button" key={house.id || `${house.latitude}-${house.longitude}-${index}`} className={`streetview-house-row ${active ? 'active' : ''}`} onClick={() => selectHouse(house)}>
                    <span><MapPin size={15}/></span>
                    <div><strong>{house.address || `House ${index + 1}`}</strong><small>{house.status ? house.status.replaceAll('_',' ') : 'Mapped property'}</small></div>
                    <ChevronRight size={15}/>
                  </button>;
                })}
              </div>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}

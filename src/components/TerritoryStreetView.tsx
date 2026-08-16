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
    mapillary?: any;
    __northSplashMapillaryPromise?: Promise<any>;
  }
}

const MAPILLARY_TOKEN = (import.meta.env.VITE_MAPILLARY_ACCESS_TOKEN || '').trim();
const MAPILLARY_JS = 'https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.js';
const MAPILLARY_CSS = 'https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.css';

function loadMapillary() {
  if (window.mapillary?.Viewer) return Promise.resolve(window.mapillary);
  if (window.__northSplashMapillaryPromise) return window.__northSplashMapillaryPromise;
  if (!MAPILLARY_TOKEN) return Promise.reject(new Error('MAPILLARY_TOKEN_MISSING'));

  window.__northSplashMapillaryPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-ns-mapillary="true"]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = MAPILLARY_CSS;
      css.dataset.nsMapillary = 'true';
      document.head.appendChild(css);
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-ns-mapillary="true"]');
    if (existing) {
      const wait = window.setInterval(() => {
        if (window.mapillary?.Viewer) {
          window.clearInterval(wait);
          resolve(window.mapillary);
        }
      }, 80);
      window.setTimeout(() => {
        window.clearInterval(wait);
        if (!window.mapillary?.Viewer) reject(new Error('Mapillary viewer failed to load.'));
      }, 12000);
      return;
    }

    const script = document.createElement('script');
    script.src = MAPILLARY_JS;
    script.async = true;
    script.dataset.nsMapillary = 'true';
    script.onload = () => window.mapillary?.Viewer ? resolve(window.mapillary) : reject(new Error('Mapillary viewer failed to initialize.'));
    script.onerror = () => reject(new Error('Mapillary viewer failed to load.'));
    document.head.appendChild(script);
  });

  return window.__northSplashMapillaryPromise;
}

function distanceMeters(aLat:number,aLng:number,bLat:number,bLng:number) {
  const r=6371000, rad=Math.PI/180;
  const dLat=(bLat-aLat)*rad, dLng=(bLng-aLng)*rad;
  const x=Math.sin(dLat/2)**2+Math.cos(aLat*rad)*Math.cos(bLat*rad)*Math.sin(dLng/2)**2;
  return 2*r*Math.asin(Math.sqrt(x));
}

async function nearestMapillaryImage(house: StreetViewHouse) {
  const lat=Number(house.latitude), lng=Number(house.longitude);
  // Roughly a 120 m search box. We choose the nearest returned capture client-side.
  const latPad=0.0011;
  const lngPad=0.0011/Math.max(0.25,Math.cos(lat*Math.PI/180));
  const bbox=[lng-lngPad,lat-latPad,lng+lngPad,lat+latPad].join(',');
  const url=`https://graph.mapillary.com/images?access_token=${encodeURIComponent(MAPILLARY_TOKEN)}&fields=id,geometry,captured_at,compass_angle&bbox=${bbox}&limit=100`;
  const response=await fetch(url);
  if(!response.ok) throw new Error(response.status===401||response.status===403?'MAPILLARY_TOKEN_INVALID':'Mapillary imagery lookup failed.');
  const json=await response.json();
  const images=(json?.data||[]).filter((x:any)=>x?.id&&Array.isArray(x?.geometry?.coordinates));
  if(!images.length) return null;
  images.sort((a:any,b:any)=>distanceMeters(lat,lng,Number(a.geometry.coordinates[1]),Number(a.geometry.coordinates[0]))-distanceMeters(lat,lng,Number(b.geometry.coordinates[1]),Number(b.geometry.coordinates[0])));
  return images[0];
}

function externalMapillaryUrl(house?: StreetViewHouse | null, imageId?: string | null) {
  if (imageId) return `https://www.mapillary.com/app/?pKey=${encodeURIComponent(imageId)}&focus=photo`;
  if (!house) return 'https://www.mapillary.com/app/';
  return `https://www.mapillary.com/app/?lat=${house.latitude}&lng=${house.longitude}&z=17`;
}

export default function TerritoryStreetView({ houses, activeHouse, onActiveHouseChange }: Props) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const mapillaryViewerRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [imageId,setImageId]=useState<string|null>(null);
  const [internalActive, setInternalActive] = useState<StreetViewHouse | null>(activeHouse || houses[0] || null);

  useEffect(() => {
    if (activeHouse) setInternalActive(activeHouse);
    else if (!internalActive && houses.length) setInternalActive(houses[0]);
  }, [activeHouse, houses, internalActive]);

  useEffect(()=>()=>{try{mapillaryViewerRef.current?.remove?.()}catch{} mapillaryViewerRef.current=null},[]);

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
    setLoading(true); setError(''); setAvailable(null); setImageId(null);
    try {
      if(!MAPILLARY_TOKEN) throw new Error('MAPILLARY_TOKEN_MISSING');
      const [mly,image]=await Promise.all([loadMapillary(),nearestMapillaryImage(house)]);
      if(!image?.id) throw new Error('NO_MAPILLARY_IMAGERY');
      setImageId(String(image.id));
      if(!mapillaryViewerRef.current){
        mapillaryViewerRef.current=new mly.Viewer({
          accessToken:MAPILLARY_TOKEN,
          container:viewerRef.current,
          imageId:String(image.id),
          component:{cover:false,sequence:true,zoom:true},
        });
      }else{
        await mapillaryViewerRef.current.moveTo(String(image.id));
        mapillaryViewerRef.current.resize?.();
      }
      setAvailable(true);
    } catch (err:any) {
      setAvailable(false);
      const code=err?.message||'';
      setError(code==='MAPILLARY_TOKEN_MISSING'
        ? 'Add the free Mapillary client access token in Vercel as VITE_MAPILLARY_ACCESS_TOKEN.'
        : code==='MAPILLARY_TOKEN_INVALID'
          ? 'The Mapillary token was rejected. Check the Vercel environment variable and redeploy.'
          : code==='NO_MAPILLARY_IMAGERY'
            ? 'No Mapillary street imagery was found close to this property. Coverage varies by street.'
            : 'Street imagery could not be loaded for this property.');
    } finally { setLoading(false); }
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
          <small>FREE STREET-LEVEL PROPERTY REVIEW</small>
          <strong>{open ? 'Hide Street View' : 'Check Street View'}</strong>
          <em>{houses.length ? `${houses.length} mapped ${houses.length === 1 ? 'house' : 'houses'} ready to inspect · powered by Mapillary` : 'Load or preview houses to inspect available street imagery'}</em>
        </span>
        <span className="streetview-toggle-action">{open ? 'Close' : 'Open viewer'} <ChevronRight size={17} /></span>
      </button>

      {open && (
        <div className="territory-streetview-body">
          <header className="territory-streetview-head">
            <div>
              <span className="eyebrow">INTERACTIVE STREET IMAGERY · MAPILLARY</span>
              <h3>{current?.address || 'Choose a mapped house'}</h3>
              <p>Look around and move through available street captures without leaving North Splash. Imagery coverage depends on community captures.</p>
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
              {current && loading && <div className="streetview-overlay"><RefreshCw className="spin" size={28}/><strong>Finding nearest free street imagery…</strong><span>{current.address || `${current.latitude.toFixed(5)}, ${current.longitude.toFixed(5)}`}</span></div>}
              {current && !loading && available === false && <div className="streetview-overlay streetview-error"><KeyRound size={28}/><strong>Street imagery unavailable</strong><span>{error}</span><a className="btn-primary" target="_blank" rel="noreferrer" href={externalMapillaryUrl(current,imageId)}>Check Mapillary <ExternalLink size={14}/></a></div>}
            </div>

            <aside className="streetview-house-list">
              <div className="streetview-house-list-head"><div><strong>Territory Houses</strong><small>Click a property to move the viewer</small></div><span>{houses.length}</span></div>
              <div className="streetview-house-scroll">
                {houses.length === 0 && <div className="ns-empty compact">No mapped houses yet.</div>}
                {houses.slice(0,250).map((house,index)=>{
                  const active=current&&(house.id&&current.id?house.id===current.id:house.latitude===current.latitude&&house.longitude===current.longitude);
                  return <button type="button" key={house.id||`${house.latitude}-${house.longitude}-${index}`} className={`streetview-house-row ${active?'active':''}`} onClick={()=>selectHouse(house)}><span><MapPin size={15}/></span><div><strong>{house.address||`House ${index+1}`}</strong><small>{house.status?house.status.replaceAll('_',' '):'Mapped property'}</small></div><ChevronRight size={15}/></button>;
                })}
              </div>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
}

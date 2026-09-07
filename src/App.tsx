import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';

const Checkout = lazy(() => import('@/pages/Checkout'));

function Loader() {
  return (
    <div className="route-loader">
      <img className="route-loader-lockup" src="/ns-auto-luxe-full-logo.png" alt="North Splash Auto Luxe" />
      <div><strong>North Splash Auto Luxe</strong><span>Opening the detailing site…</span></div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

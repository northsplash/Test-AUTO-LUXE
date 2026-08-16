import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';

const Login = lazy(() => import('@/pages/Login'));
const Portal = lazy(() => import('@/pages/Portal'));
const Admin = lazy(() => import('@/pages/Admin'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const ManagerPortal = lazy(() => import('@/pages/Manager'));
const EmployeePortal = lazy(() => import('@/pages/Employee'));
const D2DPortal = lazy(() => import('@/pages/D2D'));

function RouteLoader() {
  return (
    <div className="route-loader" role="status" aria-live="polite">
      <div className="route-loader-mark">NS</div>
      <div>
        <strong>North Splash</strong>
        <span>Loading workspace…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/manager" element={<ManagerPortal />} />
          <Route path="/employee" element={<EmployeePortal />} />
          <Route path="/d2d" element={<D2DPortal />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

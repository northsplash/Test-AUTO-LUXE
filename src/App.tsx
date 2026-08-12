import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Portal from '@/pages/Portal';
import Admin from '@/pages/Admin';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Checkout from '@/pages/Checkout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

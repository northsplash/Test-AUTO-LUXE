import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: 'customer' | 'admin' | 'employee' | 'detailer' | 'd2d_agent';
  vehicle_info: string | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_name: string;
  plan_price: number;
  status: 'active' | 'paused' | 'cancelled';
  next_detail_date: string | null;
  billing_cycle_start: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  service_name: string;
  package_name: string | null;
  add_ons: string[];
  vehicle_info: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  notes: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  user_id: string;
  appointment_id: string | null;
  subscription_id: string | null;
  amount: number;
  payment_method: string;
  status: string;
  description: string | null;
  created_at: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  hire_date: string | null;
  status: string;
  commission_rate: number;
  jobs_completed: number;
  total_earnings: number;
  notes: string | null;
  created_at: string;
};

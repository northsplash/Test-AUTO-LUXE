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
  status: 'active' | 'paused' | 'cancelled' | 'pending';
  next_detail_date: string | null;
  billing_cycle_start: string | null;
  cancelled_at: string | null;
  square_customer_id?: string | null;
  square_card_id?: string | null;
  square_subscription_id?: string | null;
  square_plan_variation_id?: string | null;
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
  archived?: boolean;
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
  start_date?: string | null;
  status: string;
  employment_level?: number;
  pay_type?: 'hourly' | 'base_commission' | string;
  hourly_rate?: number;
  weekly_base?: number;
  commission_rate: number;
  title?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  jobs_completed: number;
  total_earnings: number;
  notes: string | null;
  created_at: string;
};

export type RecruitingCandidate = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string;
  stage: string;
  source: string | null;
  expected_pay: number | null;
  interview_date: string | null;
  start_date: string | null;
  background_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeShift = {
  id: string;
  employee_id: string;
  shift_date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TimeEntry = {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  break_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
};

export type SalesRecord = {
  id: string;
  employee_id: string | null;
  appointment_id: string | null;
  customer_name: string | null;
  service_name: string;
  sale_amount: number;
  status: string;
  sold_at: string;
  notes: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  recurring: boolean;
  notes: string | null;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorder_level: number;
  unit_cost: number;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PaySetting = {
  id: string;
  role_key: string;
  employment_level: number;
  label: string;
  pay_type: string;
  hourly_rate: number;
  weekly_base: number;
  commission_rate: number;
  created_at: string;
  updated_at: string;
};

export type CompanySetting = {
  id: string;
  company_value: number;
  valuation_note: string | null;
  updated_at: string;
};

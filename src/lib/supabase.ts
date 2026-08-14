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
  portal_role?: 'owner' | 'manager' | 'employee' | 'd2d' | 'recruiter' | 'finance' | 'customer';
  permissions?: Record<string, boolean>;
  is_active?: boolean;
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
  assigned_employee_id?: string | null;
  assigned_manager_id?: string | null;
  sales_rep_employee_id?: string | null;
  estimated_duration_minutes?: number | null;
  actual_duration_minutes?: number | null;
  internal_notes?: string | null;
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
  user_id?: string | null;
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
  manager_employee_id?: string | null;
  department?: string | null;
  work_location?: string | null;
  pto_hours?: number;
  training_status?: string;
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


export type LeadTerritory = {
  id: string; name: string; assigned_employee_id: string | null; center_lat: number | null; center_lng: number | null; radius_meters: number; status: string; notes: string | null; created_at: string; updated_at: string;
};

export type Lead = {
  id: string; assigned_employee_id: string | null; territory_id: string | null; customer_name: string | null; address: string | null; city: string | null; state: string | null; postal_code: string | null; phone: string | null; email: string | null; latitude: number | null; longitude: number | null; status: string; source: string; service_interest: string | null; vehicle_info: string | null; estimated_value: number; actual_sale_amount: number; follow_up_at: string | null; appointment_id: string | null; notes: string | null; last_contacted_at: string | null; created_at: string; updated_at: string;
};

export type LeadActivity = { id: string; lead_id: string; employee_id: string | null; activity_type: string; previous_status: string | null; new_status: string | null; notes: string | null; created_at: string; };
export type RepLocation = { id: string; employee_id: string; latitude: number; longitude: number; accuracy_meters: number | null; captured_at: string; };
export type BusinessTask = { id: string; title: string; description: string | null; assigned_employee_id: string | null; created_by: string | null; related_appointment_id: string | null; priority: string; status: string; due_at: string | null; completed_at: string | null; created_at: string; updated_at: string; };
export type TimeOffRequest = { id: string; employee_id: string; start_date: string; end_date: string; request_type: string; hours_requested: number | null; reason: string | null; status: string; manager_note: string | null; created_at: string; updated_at: string; };
export type EquipmentAsset = { id: string; name: string; category: string; serial_number: string | null; purchase_date: string | null; purchase_cost: number; assigned_employee_id: string | null; condition: string; status: string; next_maintenance_at: string | null; notes: string | null; created_at: string; updated_at: string; };
export type EmployeeDocument = { id: string; employee_id: string | null; candidate_id: string | null; document_type: string; title: string; file_url: string | null; expires_at: string | null; notes: string | null; created_at: string; };
export type BusinessNotification = { id: string; target_user_id: string | null; target_employee_id: string | null; target_portal_role: string | null; title: string; message: string; notification_type: string; link: string | null; read_at: string | null; created_at: string; };
export type AuditLog = { id: string; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; details: Record<string, unknown>; created_at: string; };
export type PayrollRun = { id: string; period_start: string; period_end: string; status: string; gross_pay: number; notes: string | null; approved_by: string | null; approved_at: string | null; created_at: string; };

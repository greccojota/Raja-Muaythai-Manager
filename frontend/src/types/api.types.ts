export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserRead {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  size: number
  pages: number
  items: T[]
}

export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type Gender = 'M' | 'F' | 'O'
export type StudentModality = 'muaythai' | 'boxing' | 'both'

export interface StudentListItem {
  id: string
  name: string
  cpf?: string
  phone?: string
  whatsapp?: string
  email?: string
  status: StudentStatus
  modality: StudentModality
  photo_url?: string
  created_at: string
}

export interface StudentRead extends StudentListItem {
  rg?: string
  birth_date?: string
  gender?: Gender
  address_zip?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  legal_guardian_name?: string
  legal_guardian_phone?: string
  notes?: string
  updated_at: string
}

export interface StudentCreate {
  name: string
  cpf?: string
  rg?: string
  birth_date?: string
  gender?: Gender
  phone?: string
  whatsapp?: string
  email?: string
  address_zip?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  legal_guardian_name?: string
  legal_guardian_phone?: string
  notes?: string
  modality?: StudentModality
}

export type PlanType = 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type PlanModality = 'collective' | 'personal'

export interface PlanRead {
  id: string
  name: string
  plan_type: PlanType
  plan_modality: PlanModality
  billing_cycle_days: number
  monthly_value: string
  description?: string
  is_active: boolean
}

export interface PlanCreate {
  name: string
  plan_type: PlanType
  plan_modality: PlanModality
  monthly_value: number
  description?: string
  is_active?: boolean
}

export type EnrollmentStatus = 'active' | 'cancelled' | 'expired' | 'suspended'

export interface EnrollmentRead {
  id: string
  student_id: string
  student_name?: string
  plan_id: string
  plan?: PlanRead
  start_date: string
  end_date?: string
  status: EnrollmentStatus
  final_monthly_value: string
  discount_value: string
  discount_notes?: string
  payment_method: PaymentMethod
  first_payment_date?: string
  next_payment_due_date?: string
  notes?: string
  cancelled_at?: string
  cancelled_reason?: string
  created_at: string
}

export interface EnrollmentUpdate {
  status?: EnrollmentStatus
  end_date?: string
  discount_value?: number
  discount_notes?: string
  notes?: string
  cancelled_reason?: string
}

export interface EnrollmentCreate {
  student_id: string
  plan_id: string
  start_date: string
  payment_method?: PaymentMethod
  first_payment_date?: string
  next_payment_due_date?: string
  discount_value?: number
  discount_notes?: string
  notes?: string
}

export type ARStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'cash' | 'pix' | 'debit' | 'credit' | 'transfer'

export interface AccountsReceivableRead {
  id: string
  enrollment_id?: string
  student_id: string
  student_name?: string
  enrollment_end_date?: string
  description: string
  due_date: string
  amount: string
  status: ARStatus
  reference_month?: string
  expected_payment_method?: PaymentMethod
  reminder_sent_at?: string
  overdue_notice_sent_at?: string
  created_at: string
}

export interface PaymentCreate {
  ar_id: string
  amount_paid: number
  payment_method: PaymentMethod
  notes?: string
}

export interface DelinquentStudentRead {
  student_id: string
  student_name: string
  total_overdue: string
  oldest_due_date: string
  overdue_count: number
}

export interface FinancialSummary {
  gross_revenue_month: string
  net_revenue_month: string
  pending_month: string
  overdue_total: string
  active_students: number
  inactive_students: number
  delinquent_students: number
}

export interface MonthlyRevenuePoint {
  month: string
  paid: number
  pending: number
  overdue: number
}

export interface DashboardSummary {
  kpis: FinancialSummary
  revenue_by_month: MonthlyRevenuePoint[]
  students_by_status: Array<{ status: StudentStatus; total: number }>
  students_by_modality: Array<{ modality: StudentModality; total: number }>
  enrollments_expiring: Array<{
    student_id: string
    student_name: string
    plan_name: string
    end_date: string
  }>
}

export interface ARSummary {
  total_pending: number
  total_overdue: number
  total_paid_this_month: number
  total_amount_pending: string
  total_amount_overdue: string
  total_amount_paid_this_month: string
}

export interface ApiError {
  detail: string
}

export interface InstructorRead {
  id: string
  name: string
  phone?: string
  email?: string
  specialization?: string
  bio?: string
  is_active: boolean
  created_at?: string
}

export interface InstructorCreate {
  name: string
  phone?: string
  email?: string
  specialization?: string
  bio?: string
  is_active?: boolean
}

export interface ClassScheduleRead {
  id: string
  weekday: number
  weekday_name?: string
  start_time: string
  end_time: string
}

export interface ClassGroupRead {
  id: string
  name: string
  class_type?: PlanModality
  instructor?: InstructorRead
  max_students?: number
  description?: string
  is_active: boolean
  schedules: ClassScheduleRead[]
  enrolled_count?: number
}

export interface ClassEnrollmentRead {
  id: string
  class_group_id: string
  student_id: string
  student_name?: string
  enrolled_at: string
  is_active: boolean
}

export interface PrivateClassRead {
  id: string
  student_id: string
  student_name?: string
  instructor?: InstructorRead
  scheduled_at: string
  start_time: string
  duration_minutes: number
  value: string
  status: string
  notes?: string
}

export interface AttendanceRead {
  id: string
  student_id: string
  student_name?: string
  class_group_id?: string
  class_group_name?: string
  check_in_at: string
  check_in_type: string
  notes?: string
}

export interface AttendanceSummary {
  student_id: string
  student_name: string
  total_checkins: number
  checkins_this_month: number
  last_checkin?: string
}

export interface BeltLevelRead {
  id: string
  name: string
  order_index: number
  color_hex?: string
  description?: string
  is_active: boolean
}

export interface GraduationEventRead {
  id: string
  name: string
  event_date: string
  instructor?: InstructorRead
  notes?: string
  graduation_count?: number
}

export interface GraduationRead {
  id: string
  student_id: string
  student_name?: string
  graduation_event_id: string
  event_name?: string
  event_date?: string
  belt?: BeltLevelRead
  instructor?: InstructorRead
  result: string
  fee_paid: boolean
  fee_amount: string
  notes?: string
}

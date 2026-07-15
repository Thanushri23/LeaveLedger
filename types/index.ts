export type Role = 'employee' | 'manager'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: Role
  department: string | null
  created_at: string
}

export interface LeaveType {
  id: string
  name: string
  default_days: number
  color: string
}

export interface LeaveBalance {
  id: string
  employee_id: string
  leave_type_id: string
  year: number
  total_days: number
  used_days: number
  remaining_days: number
  created_at: string
  leave_types?: LeaveType
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  manager_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  leave_types?: LeaveType
}

export interface Notification {
  id: string
  user_id: string
  message: string
  is_read: boolean
  created_at: string
}

export interface SessionUser {
  id: string
  email: string
  role: Role
  full_name: string
  department: string | null
}

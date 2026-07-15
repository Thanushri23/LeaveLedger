import { z } from 'zod'

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Please enter a valid email').trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['employee', 'manager'], { error: 'Please select a role' }),
  department: z.string().min(1, 'Please enter your department').trim(),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email').trim(),
  password: z.string().min(1, 'Password is required'),
})

export const leaveRequestSchema = z.object({
  leave_type_id: z.string().uuid('Please select a leave type'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Please provide a reason (at least 10 characters)').trim(),
})

export const approvalSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(['approved', 'rejected']),
  manager_comment: z.string().optional(),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>
export type ApprovalInput = z.infer<typeof approvalSchema>

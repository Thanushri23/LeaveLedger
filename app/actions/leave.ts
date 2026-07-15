'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { leaveRequestSchema, approvalSchema } from '@/lib/validations'
import { countWorkingDays, todayStr } from '@/lib/utils'

export type LeaveFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | undefined

// ─── Apply for Leave ──────────────────────────────────────────────────────────
export async function applyLeaveAction(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const raw = {
    leave_type_id: formData.get('leave_type_id'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    reason: formData.get('reason'),
  }

  const parsed = leaveRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { leave_type_id, start_date, end_date, reason } = parsed.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorized. Please log in.' }

  // 1. Prevent past start dates
  if (start_date < todayStr()) {
    return { errors: { start_date: ['Start date cannot be in the past.'] } }
  }
  if (end_date < start_date) {
    return { errors: { end_date: ['End date cannot be before start date.'] } }
  }

  // 2. Calculate working days
  const totalDays = countWorkingDays(start_date, end_date)
  if (totalDays <= 0) {
    return { message: 'The selected date range contains no working days (Mon–Fri only).' }
  }

  // 3. Check for overlap with existing pending/approved requests
  const { data: existing } = await supabase
    .from('leave_requests')
    .select('start_date, end_date')
    .eq('employee_id', user.id)
    .in('status', ['pending', 'approved'])

  const hasOverlap = (existing ?? []).some(
    (r) => start_date <= r.end_date && end_date >= r.start_date
  )
  if (hasOverlap) {
    return { message: 'You already have an overlapping pending or approved leave for these dates.' }
  }

  // 4. Check balance
  const year = new Date(start_date).getFullYear()
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('remaining_days')
    .eq('employee_id', user.id)
    .eq('leave_type_id', leave_type_id)
    .eq('year', year)
    .single()

  if (!balance) {
    return { message: 'No leave balance found for this type and year. Contact your manager.' }
  }
  if (balance.remaining_days < totalDays) {
    return {
      message: `Insufficient balance. You need ${totalDays} days but only have ${balance.remaining_days} remaining.`,
    }
  }

  // 5. Insert request
  const { error } = await supabase.from('leave_requests').insert({
    employee_id: user.id,
    leave_type_id,
    start_date,
    end_date,
    total_days: totalDays,
    reason,
    status: 'pending',
  })
  if (error) return { message: error.message }

  // 6. Notify manager(s) in same department
  const { data: emp } = await supabase
    .from('profiles')
    .select('full_name, department')
    .eq('id', user.id)
    .single()

  if (emp) {
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'manager')
      .eq('department', emp.department)

    if (managers?.length) {
      await supabase.from('notifications').insert(
        managers.map((m) => ({
          user_id: m.id,
          message: `${emp.full_name} submitted a ${totalDays}-day leave request.`,
          is_read: false,
        }))
      )
    }
  }

  revalidatePath('/employee/dashboard')
  revalidatePath('/employee/history')
  redirect('/employee/history')
}

// ─── Cancel a pending leave request ──────────────────────────────────────────
export async function cancelLeaveAction(requestId: string): Promise<LeaveFormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorized.' }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('employee_id', user.id)
    .eq('status', 'pending')

  if (error) return { message: error.message }

  revalidatePath('/employee/history')
  revalidatePath('/employee/dashboard')
  return { success: true }
}

// ─── Manager: approve or reject a request ────────────────────────────────────
export async function reviewLeaveAction(
  _prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const raw = {
    request_id: formData.get('request_id'),
    action: formData.get('action'),
    manager_comment: formData.get('manager_comment') ?? '',
  }

  const parsed = approvalSchema.safeParse(raw)
  if (!parsed.success) return { message: 'Invalid submission.' }

  const { request_id, action, manager_comment } = parsed.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Unauthorized.' }

  // Check if current user is a valid profile to avoid FK errors
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()

  // Fetch the request to know employee + days
  const { data: req } = await supabase
    .from('leave_requests')
    .select('employee_id, leave_type_id, total_days, start_date')
    .eq('id', request_id)
    .single()

  if (!req) return { message: 'Leave request not found.' }

  // Update the request status.
  // reviewed_by has a FK → public.profiles(id), so we only set it when
  // the manager's profile row is confirmed to exist in that table.
  const updatePayload: {
    status: string
    manager_comment: string | null
    reviewed_at: string
    reviewed_by?: string
  } = {
    status: action,
    manager_comment: manager_comment || null,
    reviewed_at: new Date().toISOString(),
  }
  if (profile) updatePayload.reviewed_by = user.id

  const { error } = await supabase
    .from('leave_requests')
    .update(updatePayload)
    .eq('id', request_id)

  if (error) return { message: error.message }

  // If approved, increment used_days in leave_balances.
  // We read the current value first then write (used_days + total_days).
  // remaining_days is a generated column (total_days - used_days) so it
  // updates automatically — no RPC function needed.
  if (action === 'approved') {
    const year = new Date(req.start_date).getFullYear()

    const { data: bal, error: balFetchError } = await supabase
      .from('leave_balances')
      .select('used_days')
      .eq('employee_id', req.employee_id)
      .eq('leave_type_id', req.leave_type_id)
      .eq('year', year)
      .single()

    if (balFetchError || !bal) {
      return { message: 'Could not find leave balance to update. Approval was saved but balance was not deducted.' }
    }

    const { error: balUpdateError } = await supabase
      .from('leave_balances')
      .update({ used_days: bal.used_days + req.total_days })
      .eq('employee_id', req.employee_id)
      .eq('leave_type_id', req.leave_type_id)
      .eq('year', year)

    if (balUpdateError) {
      return { message: `Approved but balance deduction failed: ${balUpdateError.message}` }
    }
  }

  // Notify the employee
  const verb = action === 'approved' ? 'approved ✅' : 'rejected ❌'
  await supabase.from('notifications').insert({
    user_id: req.employee_id,
    message: `Your leave request has been ${verb}.${manager_comment ? ` Note: ${manager_comment}` : ''}`,
    is_read: false,
  })

  revalidatePath('/manager/approvals')
  revalidatePath('/manager/dashboard')
  return { success: true, message: `Request ${action} successfully.` }
}

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import HistoryTable from './HistoryTable'

export const metadata: Metadata = { title: 'My Leave History' }

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*, leave_types(name, color)')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: false })

  type RawRequest = {
    id: string
    leave_types: { name: string; color: string }[] | { name: string; color: string } | null
    start_date: string
    end_date: string
    total_days: number
    status: string
    reason: string
    manager_comment: string | null
    created_at: string
  }

  const normalized = (requests as RawRequest[] ?? []).map((r) => ({
    ...r,
    leave_types: Array.isArray(r.leave_types) ? r.leave_types[0] ?? null : r.leave_types,
  }))

  // Stats
  const total = normalized.length
  const pending = normalized.filter((r) => r.status === 'pending').length
  const approved = normalized.filter((r) => r.status === 'approved').length
  const totalDays = normalized
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.total_days, 0)

  return (
    <div className="p-8 fade-in">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Leave History
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            All your leave requests for this account
          </p>
        </div>
        <a href="/employee/apply" className="btn btn-primary">
          ✏️ Apply for Leave
        </a>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Requests', value: total, color: '#818cf8' },
          { label: 'Pending', value: pending, color: '#f59e0b' },
          { label: 'Approved', value: approved, color: '#10b981' },
          { label: 'Days Approved', value: `${totalDays}d`, color: '#6366f1' },
        ].map((s) => (
          <div key={s.label} className="glass p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <HistoryTable requests={normalized} />
    </div>
  )
}

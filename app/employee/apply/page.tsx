import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ApplyLeaveForm from './ApplyLeaveForm'

export const metadata: Metadata = { title: 'Apply for Leave' }

export default async function ApplyLeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const year = new Date().getFullYear()

  const [{ data: leaveTypes }, { data: balances }] = await Promise.all([
    supabase.from('leave_types').select('id, name, color, default_days').order('name'),
    supabase
      .from('leave_balances')
      .select('leave_type_id, remaining_days, total_days')
      .eq('employee_id', user!.id)
      .eq('year', year),
  ])

  return (
    <div className="p-8 fade-in max-w-2xl">
      <div className="mb-8">
        <a
          href="/employee/dashboard"
          className="text-sm mb-4 inline-flex items-center gap-1"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Back to dashboard
        </a>
        <h1 className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
          Apply for Leave
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Weekends are excluded from day calculations automatically.
        </p>
      </div>

      <div className="glass p-6">
        {leaveTypes && leaveTypes.length > 0 ? (
          <ApplyLeaveForm
            leaveTypes={leaveTypes}
            balances={balances ?? []}
          />
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>
            No leave types configured. Please contact your manager.
          </p>
        )}
      </div>

      {/* Balance summary */}
      {balances && balances.length > 0 && leaveTypes && (
        <div className="mt-6">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Your {year} Balances
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {balances.map((b) => {
              const lt = leaveTypes.find((l) => l.id === b.leave_type_id)
              if (!lt) return null
              const pct = Math.round((b.remaining_days / b.total_days) * 100)
              return (
                <div key={b.leave_type_id} className="glass p-3 text-center">
                  <div
                    className="w-2 h-2 rounded-full mx-auto mb-2"
                    style={{ background: lt.color }}
                  />
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {lt.name}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: lt.color }}>
                    {b.remaining_days}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    / {b.total_days} days
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

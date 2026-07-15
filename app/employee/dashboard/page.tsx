import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department')
    .eq('id', user!.id)
    .single()

  const year = new Date().getFullYear()
  const { data: balances } = await supabase
    .from('leave_balances')
    .select('*, leave_types(name, color, default_days)')
    .eq('employee_id', user!.id)
    .eq('year', year)
    .order('created_at')

  const { data: recentRequests } = await supabase
    .from('leave_requests')
    .select('*, leave_types(name, color)')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{greeting} 👋</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {profile?.full_name ?? 'Employee'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {profile?.department} · {year} leave overview
        </p>
      </div>

      {/* Balance cards */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Leave Balances
        </h2>
        {balances && balances.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(balances as Array<{
              id: string
              leave_types?: { name: string; color: string; default_days: number } | null
              remaining_days: number
              used_days: number
              total_days: number
            }>).map((b) => {
              const lt = b.leave_types
              if (!lt) return null
              const pct = Math.round(((b.total_days - b.used_days) / b.total_days) * 100)
              return (
                <div key={b.id} className="glass card-hover p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${lt.color}22`, border: `1px solid ${lt.color}44` }}
                    >
                      <div className="dot" style={{ background: lt.color, width: 12, height: 12 }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{lt.name} Leave</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{lt.default_days} days/year</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="h-2 rounded-full" style={{ background: 'var(--surface-3)' }}>
                      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: lt.color }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>
                      Used: <strong style={{ color: 'var(--text-secondary)' }}>{b.used_days}d</strong>
                    </span>
                    <span style={{ color: lt.color, fontWeight: 700 }}>{b.remaining_days}d remaining</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="glass p-6 text-center" style={{ color: 'var(--text-muted)' }}>
            No leave balances found. Please contact your manager.
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="mb-8 flex gap-3 flex-wrap">
        <a href="/employee/apply" className="btn btn-primary">✏️ Apply for Leave</a>
        <a href="/employee/history" className="btn btn-secondary">📂 View History</a>
      </section>

      {/* Recent requests */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Recent Requests
        </h2>
        {recentRequests && recentRequests.length > 0 ? (
          <div className="glass overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  {['Type', 'Dates', 'Days', 'Status', 'Submitted'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentRequests as Array<{
                  id: string
                  leave_types?: { name: string; color: string } | null
                  start_date: string
                  end_date: string
                  total_days: number
                  status: string
                  created_at: string
                }>).map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <span className="dot" style={{ background: r.leave_types?.color ?? '#6366f1' }} />
                        {r.leave_types?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{r.start_date} → {r.end_date}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{r.total_days}d</td>
                    <td className="px-5 py-3"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass p-6 text-center" style={{ color: 'var(--text-muted)' }}>
            No leave requests yet.{' '}
            <a href="/employee/apply" style={{ color: 'var(--brand-400)' }}>Apply for your first one →</a>
          </div>
        )}
      </section>
    </div>
  )
}

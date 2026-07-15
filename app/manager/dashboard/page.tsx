import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Manager Dashboard' }

export default async function ManagerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department')
    .eq('id', user!.id)
    .single()

  // All pending requests across all employees
  const { count: pendingCount } = await supabase
    .from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Team members on leave today
  const today = new Date().toISOString().split('T')[0]
  const { data: onLeaveTodayRaw } = await supabase
    .from('leave_requests')
    .select('employee_id, leave_types(name, color)')
    .eq('status', 'approved')
    .lte('start_date', today)
    .gte('end_date', today)

  // Recent leave requests (last 8)
  const { data: recentRaw } = await supabase
    .from('leave_requests')
    .select('id, employee_id, start_date, end_date, total_days, status, leave_types(name, color)')
    .order('created_at', { ascending: false })
    .limit(8)

  // Fetch employee names separately
  const allEmpIds = [...new Set([
    ...(onLeaveTodayRaw ?? []).map((r: { employee_id: string }) => r.employee_id),
    ...(recentRaw ?? []).map((r: { employee_id: string }) => r.employee_id),
  ])]
  const { data: empProfiles } = allEmpIds.length
    ? await supabase.from('profiles').select('id, full_name, department').in('id', allEmpIds)
    : { data: [] }
  const empMap = Object.fromEntries(
    (empProfiles ?? []).map((p: { id: string; full_name: string; department: string }) => [p.id, p])
  )

  type LTShape = { name: string; color: string } | null

  const onLeaveToday = (onLeaveTodayRaw ?? []).map((r: { employee_id: string; leave_types: unknown }) => ({
    ...r,
    profiles: empMap[r.employee_id] ?? null,
    leave_types: (Array.isArray(r.leave_types) ? r.leave_types[0] : r.leave_types) as LTShape,
  }))

  const recentRequests = (recentRaw ?? []).map((r: { employee_id: string; leave_types: unknown; id: string; start_date: string; end_date: string; total_days: number; status: string }) => ({
    ...r,
    profiles: empMap[r.employee_id] ?? null,
    leave_types: (Array.isArray(r.leave_types) ? r.leave_types[0] : r.leave_types) as LTShape,
  }))

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{greeting} 👋</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {profile?.full_name ?? 'Manager'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {profile?.department} department overview
        </p>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Pending approvals */}
        <div
          className="glass card-hover p-5"
          style={(pendingCount ?? 0) > 0 ? { borderColor: 'rgba(245,158,11,0.4)', boxShadow: '0 0 20px rgba(245,158,11,0.1)' } : {}}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Pending Approvals</p>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-4xl font-bold" style={{ color: (pendingCount ?? 0) > 0 ? '#fbbf24' : 'var(--text-primary)' }}>
            {pendingCount ?? 0}
          </p>
          {(pendingCount ?? 0) > 0 && (
            <a href="/manager/approvals" className="text-xs mt-2 inline-block" style={{ color: '#fbbf24' }}>
              Review now →
            </a>
          )}
        </div>

        {/* On leave today */}
        <div className="glass card-hover p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>On Leave Today</p>
            <span className="text-2xl">🏖️</span>
          </div>
          <p className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {onLeaveToday?.length ?? 0}
          </p>
          {onLeaveToday && onLeaveToday.length > 0 && (
            <div className="mt-2 space-y-1">
              {(onLeaveToday as unknown as Array<{
                profiles?: { full_name: string } | null
                leave_types?: { name: string; color: string } | null
              }>).slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="dot" style={{ background: r.leave_types?.color ?? '#6366f1' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {Array.isArray(r.profiles) ? r.profiles[0]?.full_name : r.profiles?.full_name}
                  </span>
                </div>
              ))}
              {onLeaveToday.length > 3 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>+{onLeaveToday.length - 3} more</p>
              )}
            </div>
          )}
        </div>

        {/* Quick nav */}
        <div className="glass card-hover p-5 flex flex-col justify-between">
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Quick Actions</p>
          <div className="space-y-2">
            <a href="/manager/approvals" className="btn btn-primary w-full text-sm">✅ Review Requests</a>
            <a href="/manager/calendar" className="btn btn-secondary w-full text-sm">🗓️ Team Calendar</a>
          </div>
        </div>
      </section>

      {/* Recent requests */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
          Recent Team Requests
        </h2>
        {recentRequests && recentRequests.length > 0 ? (
          <div className="glass overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  {['Employee', 'Type', 'Dates', 'Days', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentRequests as Array<{
                  id: string
                  profiles?: { full_name: string } | null
                  leave_types?: { name: string; color: string } | null
                  start_date: string
                  end_date: string
                  total_days: number
                  status: string
                }>).map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{r.profiles?.full_name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <span className="dot" style={{ background: r.leave_types?.color ?? '#6366f1' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{r.leave_types?.name ?? '—'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{r.start_date} → {r.end_date}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{r.total_days}d</td>
                    <td className="px-5 py-3"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass p-6 text-center" style={{ color: 'var(--text-muted)' }}>
            No leave requests submitted yet.
          </div>
        )}
      </section>
    </div>
  )
}

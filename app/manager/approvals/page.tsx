import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ApprovalCards from './ApprovalCards'

export const metadata: Metadata = { title: 'Approvals' }

export default async function ApprovalsPage() {
  const supabase = await createClient()

  // Fetch leave requests WITHOUT profiles join (avoids RLS recursion)
  const { data: pendingRaw } = await supabase
    .from('leave_requests')
    .select('*, leave_types(name, color)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const { data: reviewedRaw } = await supabase
    .from('leave_requests')
    .select('*, leave_types(name, color)')
    .in('status', ['approved', 'rejected'])
    .order('reviewed_at', { ascending: false })
    .limit(20)

  // Collect all unique employee IDs then fetch their profiles in one query
  const allIds = [
    ...new Set([
      ...(pendingRaw ?? []).map((r: { employee_id: string }) => r.employee_id),
      ...(reviewedRaw ?? []).map((r: { employee_id: string }) => r.employee_id),
    ]),
  ]

  const { data: profileRows } = allIds.length
    ? await supabase.from('profiles').select('id, full_name, department').in('id', allIds)
    : { data: [] }

  const profileMap = Object.fromEntries(
    (profileRows ?? []).map((p: { id: string; full_name: string; department: string }) => [p.id, p])
  )

  type RawReq = {
    id: string
    employee_id: string
    leave_types: { name: string; color: string }[] | { name: string; color: string } | null
    start_date: string
    end_date: string
    total_days: number
    reason: string
    status: string
    manager_comment: string | null
    created_at: string
    reviewed_at: string | null
  }

  function normalize(arr: RawReq[]) {
    return arr.map((r) => ({
      ...r,
      profiles: profileMap[r.employee_id] ?? null,
      leave_types: Array.isArray(r.leave_types) ? r.leave_types[0] ?? null : r.leave_types,
    }))
  }

  const normalizedPending = normalize((pendingRaw as RawReq[]) ?? [])
  const normalizedReviewed = normalize((reviewedRaw as RawReq[]) ?? [])

  return (
    <div className="p-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Leave Approvals
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {normalizedPending.length} pending request{normalizedPending.length !== 1 ? 's' : ''} from your team
        </p>
      </div>

      {/* Pending */}
      <section className="mb-10">
        <h2
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          ⏳ Pending Approval
        </h2>
        <ApprovalCards requests={normalizedPending} />
      </section>

      {/* Recently reviewed */}
      {normalizedReviewed.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            📋 Recently Reviewed
          </h2>
          <div
            className="glass overflow-hidden"
            style={{ border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  {['Employee', 'Type', 'Dates', 'Days', 'Decision'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedReviewed.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {r.profiles?.full_name ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: r.leave_types?.color ?? '#6366f1' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{r.leave_types?.name ?? '—'}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {r.start_date} → {r.end_date}
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {r.total_days}d
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

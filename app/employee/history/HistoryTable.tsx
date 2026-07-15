'use client'

import { useTransition } from 'react'
import { cancelLeaveAction } from '@/app/actions/leave'
import { formatDate } from '@/lib/utils'

type Request = {
  id: string
  leave_types: { name: string; color: string } | null
  start_date: string
  end_date: string
  total_days: number
  status: string
  reason: string
  manager_comment: string | null
  created_at: string
}

export default function HistoryTable({ requests }: { requests: Request[] }) {
  const [isPending, startTransition] = useTransition()

  function handleCancel(id: string) {
    if (!confirm('Cancel this leave request?')) return
    startTransition(async () => {
      await cancelLeaveAction(id)
    })
  }

  if (requests.length === 0) {
    return (
      <div className="glass p-10 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
          No leave requests yet
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Your request history will appear here.
        </p>
        <a href="/employee/apply" className="btn btn-primary mt-4 inline-block">
          Apply for Leave
        </a>
      </div>
    )
  }

  return (
    <div className="glass overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            {['Type', 'Dates', 'Days', 'Reason', 'Status', 'Comment', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr
              key={r.id}
              style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}
            >
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: r.leave_types?.color ?? '#6366f1' }}
                  />
                  <span style={{ color: 'var(--text-primary)' }}>
                    {r.leave_types?.name ?? '—'}
                  </span>
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(r.start_date)}
                {r.start_date !== r.end_date && (
                  <span> → {formatDate(r.end_date)}</span>
                )}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                {r.total_days}d
              </td>
              <td
                className="px-4 py-3 max-w-[180px] truncate"
                style={{ color: 'var(--text-muted)' }}
                title={r.reason}
              >
                {r.reason}
              </td>
              <td className="px-4 py-3">
                <span className={`badge badge-${r.status}`}>{r.status}</span>
              </td>
              <td
                className="px-4 py-3 max-w-[150px] truncate text-xs"
                style={{ color: 'var(--text-muted)' }}
                title={r.manager_comment ?? ''}
              >
                {r.manager_comment ?? '—'}
              </td>
              <td className="px-4 py-3">
                {r.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={isPending}
                    className="text-xs px-3 py-1 rounded-lg transition-colors"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: '#fca5a5',
                      border: '1px solid rgba(239,68,68,0.2)',
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

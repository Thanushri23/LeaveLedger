'use client'

import { useActionState } from 'react'
import { reviewLeaveAction } from '@/app/actions/leave'
import { formatDate } from '@/lib/utils'

type LeaveRequest = {
  id: string
  profiles: { full_name: string; department: string } | null
  leave_types: { name: string; color: string } | null
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: string
  created_at: string
}

function ReviewForm({ request }: { request: LeaveRequest }) {
  const [state, action, isPending] = useActionState(reviewLeaveAction, undefined)

  return (
    <div
      className="glass p-5 card-hover"
      style={{ border: '1px solid rgba(99,102,241,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {request.profiles?.full_name ?? '—'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {request.profiles?.department} ·{' '}
            {new Date(request.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm flex-shrink-0">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: request.leave_types?.color ?? '#6366f1' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {request.leave_types?.name ?? '—'} Leave
          </span>
        </div>
      </div>

      {/* Date & days */}
      <div
        className="flex items-center gap-4 text-sm px-3 py-2 rounded-lg mb-4"
        style={{ background: 'var(--surface-3)' }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          📅 {formatDate(request.start_date)}
          {request.start_date !== request.end_date && ` → ${formatDate(request.end_date)}`}
        </span>
        <span
          className="ml-auto font-semibold"
          style={{ color: 'var(--brand-400)' }}
        >
          {request.total_days} day{request.total_days !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Reason */}
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Reason: </span>
        {request.reason}
      </p>

      {/* Review form */}
      <form action={action} className="space-y-3">
        <input type="hidden" name="request_id" value={request.id} />

        <textarea
          name="manager_comment"
          rows={2}
          placeholder="Optional comment to employee..."
          className="form-input w-full resize-none text-sm"
        />

        {state?.message && (
          <p
            className="text-xs"
            style={{ color: state.success ? '#6ee7b7' : '#fca5a5' }}
          >
            {state.message}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            name="action"
            value="approved"
            disabled={isPending}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(16,185,129,0.15)',
              color: '#6ee7b7',
              border: '1px solid rgba(16,185,129,0.3)',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            ✅ Approve
          </button>
          <button
            type="submit"
            name="action"
            value="rejected"
            disabled={isPending}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.2)',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            ❌ Reject
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ApprovalCards({ requests }: { requests: LeaveRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="glass p-12 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          All caught up!
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          No pending leave requests from your team.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {requests.map((r) => (
        <ReviewForm key={r.id} request={r} />
      ))}
    </div>
  )
}

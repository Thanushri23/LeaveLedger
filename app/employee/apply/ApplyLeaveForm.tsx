'use client'

import { useActionState, useEffect, useState } from 'react'
import { applyLeaveAction } from '@/app/actions/leave'
import { countWorkingDays, todayStr } from '@/lib/utils'

type LeaveType = { id: string; name: string; color: string; default_days: number }
type Balance = { leave_type_id: string; remaining_days: number; total_days: number }

export default function ApplyLeaveForm({
  leaveTypes,
  balances,
}: {
  leaveTypes: LeaveType[]
  balances: Balance[]
}) {
  const [state, action, isPending] = useActionState(applyLeaveAction, undefined)

  const today = todayStr()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedType, setSelectedType] = useState(leaveTypes[0]?.id ?? '')

  const workingDays =
    startDate && endDate && endDate >= startDate
      ? countWorkingDays(startDate, endDate)
      : 0

  const selectedBalance = balances.find((b) => b.leave_type_id === selectedType)
  const remaining = selectedBalance?.remaining_days ?? 0
  const insufficient = workingDays > 0 && workingDays > remaining

  return (
    <form action={action} className="space-y-6">
      {/* Global error/success */}
      {state?.message && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
          }}
        >
          {state.message}
        </div>
      )}

      {/* Leave type */}
      <div>
        <label
          htmlFor="leave_type_id"
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Leave Type
        </label>
        <select
          id="leave_type_id"
          name="leave_type_id"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="form-input w-full"
          required
        >
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name} Leave ({lt.default_days} days/year)
            </option>
          ))}
        </select>
        {state?.errors?.leave_type_id && (
          <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>
            {state.errors.leave_type_id[0]}
          </p>
        )}

        {/* Balance preview */}
        {selectedBalance && (
          <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{
                background: leaveTypes.find((l) => l.id === selectedType)?.color ?? '#6366f1',
              }}
            />
            <span>
              {remaining} of {selectedBalance.total_days} days remaining
            </span>
          </div>
        )}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Start Date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            min={today}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (endDate && e.target.value > endDate) setEndDate(e.target.value)
            }}
            className="form-input w-full"
            required
          />
          {state?.errors?.start_date && (
            <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>
              {state.errors.start_date[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="end_date"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            End Date
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-input w-full"
            required
          />
          {state?.errors?.end_date && (
            <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>
              {state.errors.end_date[0]}
            </p>
          )}
        </div>
      </div>

      {/* Working days preview */}
      {workingDays > 0 && (
        <div
          className="px-4 py-3 rounded-xl text-sm flex items-center justify-between"
          style={{
            background: insufficient ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
            border: `1px solid ${insufficient ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>Working days requested:</span>
          <strong style={{ color: insufficient ? '#fca5a5' : 'var(--brand-400)' }}>
            {workingDays} day{workingDays !== 1 ? 's' : ''}
            {insufficient && ` (exceeds ${remaining} remaining)`}
          </strong>
        </div>
      )}

      {/* Reason */}
      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          Reason
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={4}
          placeholder="Briefly describe your reason for taking leave..."
          className="form-input w-full resize-none"
          required
          minLength={10}
        />
        {state?.errors?.reason && (
          <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>
            {state.errors.reason[0]}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || insufficient}
          className="btn btn-primary"
          style={{ opacity: isPending || insufficient ? 0.6 : 1 }}
        >
          {isPending ? 'Submitting…' : '✉️ Submit Request'}
        </button>
        <a href="/employee/dashboard" className="btn btn-secondary">
          Cancel
        </a>
      </div>
    </form>
  )
}

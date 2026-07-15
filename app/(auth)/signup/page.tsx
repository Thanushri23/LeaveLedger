'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signupAction } from '@/app/actions/auth'

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Customer Support',
  'Legal',
]

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, undefined)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <span className="text-2xl">📋</span>
          <span className="text-xl font-bold gradient-text">LeaveLedger</span>
        </div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Create account
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Join your team on LeaveLedger
        </p>
      </div>

      {/* Global error */}
      {state?.message && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
          }}
        >
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-4">
        {/* Full name */}
        <div>
          <label htmlFor="full_name" className="label">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            className="input"
            required
          />
          {state?.errors?.full_name && (
            <p className="error-text">{state.errors.full_name[0]}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="input"
            required
          />
          {state?.errors?.email && (
            <p className="error-text">{state.errors.email[0]}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 chars with a letter & number"
            className="input"
            required
          />
          {state?.errors?.password && (
            <p className="error-text">{state.errors.password[0]}</p>
          )}
        </div>

        {/* Role + Department row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="role" className="label">
              Role
            </label>
            <select id="role" name="role" className="input" defaultValue="" required>
              <option value="" disabled>
                Select…
              </option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
            {state?.errors?.role && (
              <p className="error-text">{state.errors.role[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="department" className="label">
              Department
            </label>
            <select
              id="department"
              name="department"
              className="input"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select…
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {state?.errors?.department && (
              <p className="error-text">{state.errors.department[0]}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full mt-2"
          style={{ padding: '0.75rem 1.25rem', fontSize: '0.9375rem' }}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Creating account…
            </span>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium"
          style={{ color: 'var(--brand-400)' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}

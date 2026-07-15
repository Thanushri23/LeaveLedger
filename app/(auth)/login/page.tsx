'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6 lg:hidden">
          <span className="text-2xl">📋</span>
          <span className="text-xl font-bold gradient-text">LeaveLedger</span>
        </div>
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Welcome back
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Sign in to manage your leave requests
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

      <form action={action} className="space-y-5">
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
            autoComplete="current-password"
            placeholder="••••••••"
            className="input"
            required
          />
          {state?.errors?.password && (
            <p className="error-text">{state.errors.password[0]}</p>
          )}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium"
          style={{ color: 'var(--brand-400)' }}
        >
          Create one
        </Link>
      </p>
    </div>
  )
}

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signupSchema, loginSchema } from '@/lib/validations'

export type AuthFormState = {
  errors?: Record<string, string[]>
  message?: string
} | undefined

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const raw = {
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { full_name, email, password, role } = parsed.data
  const department = 'Engineering'
  const supabase = await createClient()

  // signUp passes metadata to the handle_new_user trigger, which atomically:
  //   1. Creates the profile row in public.profiles
  //   2. Creates leave_balance rows for every leave type (employees only)
  // No manual inserts needed here.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role, department },
    },
  })

  if (error) {
    return { message: error.message }
  }

  if (!data.user?.id) {
    return { message: 'Failed to create account. Please try again.' }
  }

  redirect(role === 'manager' ? '/manager/dashboard' : '/employee/dashboard')
}

// ─── Log In ───────────────────────────────────────────────────────────────────
export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { message: 'Invalid email or password.' }
  }

  // Fetch role to redirect correctly
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  redirect(profile?.role === 'manager' ? '/manager/dashboard' : '/employee/dashboard')
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

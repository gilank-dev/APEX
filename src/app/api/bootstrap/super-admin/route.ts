import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateBootstrapPassword } from '@/lib/security'

export async function POST() {
  const email = process.env.SUPER_ADMIN_EMAIL
  const password = process.env.SUPER_ADMIN_PASSWORD

  // (a) Fail-closed: returns 403 unless both env variables are set
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Bootstrap credentials not configured in environment.' },
      { status: 403 }
    )
  }

  // (c) Strong password check (min 12 chars, upper, lower, digit enforced; reject with 400)
  if (!validateBootstrapPassword(password)) {
    return NextResponse.json(
      { error: 'Password does not meet complexity requirements (min 12 chars, upper, lower, digit).' },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  // (b) If a super-admin already exists, return 409 without changing anything
  const { data: existingData, error: listError } = await adminClient.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json(
      { error: 'Failed to verify existing administrator accounts.' },
      { status: 500 }
    )
  }

  const foundAdmin = existingData?.users?.find(
    (u) => u.email === email || u.app_metadata?.role === 'super-admin'
  )

  if (foundAdmin) {
    return NextResponse.json(
      { error: 'Super admin account already exists.' },
      { status: 409 }
    )
  }

  // (c) Create the user with env email + strong password, email_confirm: true, metadata role super-admin
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // app_metadata is admin-only writable; users cannot self-assign the super-admin role
    app_metadata: {
      role: 'super-admin',
    },
    user_metadata: {
      company_slug: 'super-admin',
    },
  })

  if (createError || !newUser.user) {
    return NextResponse.json(
      { error: createError?.message || 'Failed to create super admin account.' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Super admin bootstrapped successfully.',
      userId: newUser.user.id,
    },
    { status: 201 }
  )
}

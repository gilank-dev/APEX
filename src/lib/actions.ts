'use server'

import { createAdminClient, createClient } from './supabase/server'
import { cookies, headers } from 'next/headers'
import { createRateLimiter, createRateLimiterPersistent } from './security'
import { effectiveTier, getMaxAllowedEmployees } from './entitlements'
import crypto from 'node:crypto'

// Best-effort in-memory rate limiter for serverless environment. Upgrade path: Upstash Redis.
const joinRateLimiter = createRateLimiterPersistent({
  maxAttempts: 10,
  windowMs: 10 * 60 * 1000,
})

const loginRateLimiter = createRateLimiter({
  maxAttempts: 10,
  windowMs: 10 * 60 * 1000,
})

const registerRateLimiter = createRateLimiter({
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000,
})

// Slug blacklist check
const BLACKLIST = [
  'admin',
  'api',
  'auth',
  'login',
  'register',
  'join',
  'dashboard',
  'billing',
  'support',
  'public',
  '_next',
  'favicon.ico',
  'super-admin',
  'pricing',
]

export async function registerTenantAction(prevState: any, formData: FormData) {
  const companyName = formData.get('companyName') as string
  const category = formData.get('category') as string
  const slug = (formData.get('slug') as string)?.toLowerCase().trim()
  const adminName = formData.get('adminName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Rate limit per IP: 5 registrations / hour (tenant-creation spam guard)
  let ip = 'unknown'
  try {
    const headerList = await headers()
    ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() || headerList.get('x-real-ip') || 'unknown'
  } catch {
    ip = 'unknown'
  }
      if (!(await registerRateLimiter.check(`reg:${ip}`)).allowed) {
    return { error: 'Terlalu banyak percobaan registrasi. Coba lagi dalam satu jam.' }
  }

  if (!companyName || !category || !slug || !adminName || !email || !password) {
    return { error: 'Semua kolom wajib diisi.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return { error: 'Format email tidak valid.' }
  }

  if (password.length < 8) {
    return { error: 'Password minimal 8 karakter.' }
  }

  if (BLACKLIST.includes(slug)) {
    return { error: 'Alamat workspace ini dipakai untuk halaman khusus sistem. Ganti dengan yang berbeda.' }
  }

  const adminClient = createAdminClient()

  // Check if company slug already exists
  const { data: existingCompany } = await adminClient
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existingCompany) {
    return { error: 'Alamat workspace ini sudah dipakai perusahaan lain. Ganti dengan yang berbeda.' }
  }

  // Create Auth User (admin API: email confirmed immediately so the auto
  // sign-in below cannot dead-end on an unverified account)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_slug: slug,
      role: 'Admin',
    },
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Failed to register admin account.' }
  }

  const userId = authData.user.id

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  // Insert Company
  const { data: company, error: companyError } = await adminClient
    .from('companies')
    .insert({
      slug,
      name: companyName,
      category,
      tier: 'free',
      active_modules: ['attendance', 'tasks'],
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single()

  if (companyError || !company) {
    // Cleanup auth user on failure
    await adminClient.auth.admin.deleteUser(userId)
    return { error: 'Gagal menyiapkan data perusahaan. Coba lagi, kalau masih gagal hubungi WhatsApp kami.' }
  }

  // Generate unique invite codes (crypto-random, rejection-sampled)
  const codeChars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const randomCode = (prefix: string) => {
    let code = prefix
    while (code.length < prefix.length + 6) {
      const b = crypto.randomBytes(1)[0]
      // 249 = largest multiple of 34 (alphabet size) — avoids modulo bias
      if (b < 249) code += codeChars[b % 34]
    }
    return code
  }
  const adminInvite = randomCode('AD-')
  const empInvite = randomCode('EM-')

  // Insert Roles
  const { data: roles, error: rolesError } = await adminClient
    .from('roles')
    .insert([
      { company_id: company.id, name: 'Admin', invite_code: adminInvite, is_admin: true, permissions: { all: true } },
      { company_id: company.id, name: 'Employee', invite_code: empInvite, is_admin: false, permissions: { attendance: true, tasks: true } },
    ])
    .select()

  if (rolesError || !roles) {
    await adminClient.from('companies').delete().eq('id', company.id)
    await adminClient.auth.admin.deleteUser(userId)
    return { error: 'Gagal menyiapkan hak akses. Data sementara sudah dibatalkan, coba daftar ulang.' }
  }

  const adminRole = roles.find((r) => r.is_admin)
  if (!adminRole) {
    return { error: 'Kesalahan sistem: role admin tidak ditemukan. Hubungi kami via WhatsApp.' }
  }

  // Insert Admin into users profile table
  const { error: userError } = await adminClient.from('users').insert({
    auth_id: userId,
    company_id: company.id,
    role_id: adminRole.id,
    email,
    full_name: adminName,
    is_dummy_account: false,
  })

  if (userError) {
    await adminClient.from('companies').delete().eq('id', company.id)
    await adminClient.auth.admin.deleteUser(userId)
    return { error: 'Gagal menyimpan profil admin. Data sementara sudah dibatalkan, coba daftar ulang.' }
  }

  // Auto Sign In by setting cookies
  const client = await createClient()
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })

  if (signInError) {
    return { error: 'Pendaftaran berhasil, tapi login otomatis gagal. Coba masuk manual dengan email dan password kamu.' }
  }

  return { success: true, slug }
}

export async function loginAdminAction(prevState: any, formData: FormData) {
  let email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' }
  }

  // Intercept super-admin credentials: map alias to env email
  if (email.trim() === 'super-lankdev') {
    email = process.env.SUPER_ADMIN_EMAIL || 'super-lankdev@apex.internal'
  }

  // Rate limit per IP + per email: 10 attempts / 10 min (brute-force guard)
  let ip = 'unknown'
  try {
    const headerList = await headers()
    ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() || headerList.get('x-real-ip') || 'unknown'
  } catch {
    ip = 'unknown'
  }
  const [ipCheck, emailCheck] = await Promise.all([
    loginRateLimiter.check(`login-ip:${ip}`),
    loginRateLimiter.check(`login-email:${email.toLowerCase()}`),
  ])
  if (!ipCheck.allowed || !emailCheck.allowed) {
    return { error: 'Terlalu banyak percobaan login. Tunggu beberapa menit lalu coba lagi.' }
  }

  const client = await createClient()
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: 'Email atau password salah.' }
  }

  const companySlug = data.user.user_metadata?.company_slug

  return { success: true, slug: companySlug }
}

export async function joinEmployeeAction(prevState: any, formData: FormData) {
  const inviteCode = formData.get('inviteCode') as string
  const fullName = formData.get('fullName') as string
  const password = formData.get('password') as string

  if (!inviteCode || !fullName || !password) {
    return { error: 'Semua kolom wajib diisi.' }
  }

  // Rate limiting per IP + per code: max 10 attempts / 10 minutes
  let ip = 'unknown'
  try {
    const headerList = await headers()
    ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() || headerList.get('x-real-ip') || 'unknown'
  } catch {
    ip = 'unknown'
  }

  const normalizedCode = inviteCode.trim().toUpperCase()
  const [ipCheck, codeCheck] = await Promise.all([
    joinRateLimiter.check(`ip:${ip}`),
    joinRateLimiter.check(`code:${normalizedCode}`),
  ])

  if (!ipCheck.allowed || !codeCheck.allowed) {
    return { error: 'Kode undangan tidak valid atau sudah kedaluwarsa. Cek lagi sama HR/bos kamu.' }
  }

  const adminClient = createAdminClient()

  // 1. Look up role and company details
  const { data: role, error: roleError } = await adminClient
    .from('roles')
    .select('*, companies(*)')
    .eq('invite_code', normalizedCode)
    .maybeSingle()

  if (roleError || !role) {
    return { error: 'Kode undangan tidak valid atau sudah kedaluwarsa. Cek lagi sama HR/bos kamu.' }
  }

  const companiesData = role.companies as any
  const companySlug = companiesData.slug
  const companyId = role.company_id
  const tier = effectiveTier(companiesData)
  const maxAllowed = getMaxAllowedEmployees(companiesData)

  // Count current workspace members
  const { count: currentMemberCount } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)

  if ((currentMemberCount || 0) >= maxAllowed) {
    return { error: `Batas kuota karyawan untuk tingkat ${tier.toUpperCase()} (${maxAllowed} orang) telah tercapai. Silakan lakukan peningkatan paket langganan.` }
  }

  // 2. Generate pseudo-email
  const generatedId = Math.random().toString(36).substring(2, 10)
  const pseudoEmail = `${generatedId}@${companySlug}.local`

  // 3. Create confirmed user via Admin API
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: pseudoEmail,
    password,
    email_confirm: true,
    user_metadata: {
      company_slug: companySlug,
      role: role.name,
    },
  })

  if (createError || !newUser.user) {
    return { error: createError?.message || 'Failed to register employee account.' }
  }

  // 4. Create profile entry
  const { error: insertError } = await adminClient.from('users').insert({
    auth_id: newUser.user.id,
    company_id: companyId,
    role_id: role.id,
    email: pseudoEmail,
    full_name: fullName,
    is_dummy_account: false,
  })

  if (insertError) {
    // Cleanup user
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return { error: 'Gagal membuat profil karyawan. Coba lagi, kalau masih gagal hubungi HR kamu.' }
  }

  // 5. Authenticate session
  const client = await createClient()
  const { error: signInError } = await client.auth.signInWithPassword({
    email: pseudoEmail,
    password,
  })

  if (signInError) {
    return { error: 'Pendaftaran berhasil. Masuk pakai email berikut: ' + pseudoEmail }
  }

  return { success: true, slug: companySlug }
}

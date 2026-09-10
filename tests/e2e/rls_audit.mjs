/**
 * RLS CROSS-TENANT LEAK TEST (local Supabase, direct PostgREST via anon key)
 *
 * Strategy: seed two companies with employees via the REST API using the
 * service-role key, then attempt cross-tenant reads/writes using the anon
 * key with each user's JWT (simulating what a malicious browser client can
 * do). Assert every attempt is rejected by RLS.
 *
 * Run: node tests/e2e/rls_audit.mjs
 */
import assert from 'node:assert/strict'

const API = 'http://127.0.0.1:54321'
// Local dev keys are HS256 JWTs signed with the local JWT secret (standard
// Supabase dev setup). Sign them ourselves since CLI output redacts keys.
const { createHmac } = await import('node:crypto')
const JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long'
function signKey(role) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const h = b64({ alg: 'HS256', typ: 'JWT' })
  const p = b64({ role, iss: 'supabase', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })
  const s = createHmac('sha256', JWT_SECRET).update(h + '.' + p).digest('base64url')
  return h + '.' + p + '.' + s
}
const ANON = process.env.SUPABASE_ANON_KEY || signKey('anon')
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || signKey('service_role')

function rest(path, { method = 'GET', key = ANON, token, body } = {}) {
  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: `Bearer ${key}` }),
    Prefer: method === 'POST' || method === 'PATCH' ? 'return=representation' : '',
  }
  if (method === 'GET') delete headers['Content-Type']
  return fetch(`${API}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
}

const results = { pass: [], fail: [] }
function check(name, cond, detail = '') {
  if (cond) results.pass.push(name), console.log(`  PASS  ${name}`)
  else results.fail.push(name + ' ' + detail), console.log(`  FAIL  ${name}  ${detail}`)
}

// ======== SEED ========
console.log('\n[SEED] two tenants, 3 users')
const suffix = Date.now().toString(36)

// 1. companies via service role
const mk = async (name) => {
  const r = await rest('companies', {
    method: 'POST',
    key: SERVICE,
    body: { name, slug: `rlsaudit-${name}-${suffix}`, tier: 'free', category: 'corporate', active_modules: ['attendance', 'tasks'] },
  })
  const j = await r.json()
  assert(r.ok, 'seed company failed ' + name + ' ' + JSON.stringify(j))
  return j[0]
}
const cA = await mk('acme')
const cB = await mk('globex')

// 2. roles via service role
const mkRole = async (companyId, name, isAdmin) => {
  const r = await rest('roles', {
    method: 'POST',
    key: SERVICE,
    body: { company_id: companyId, name, is_admin: isAdmin, invite_code: `${name}-${suffix}-${Math.random().toString(36).slice(2, 8)}` },
  })
  const j = await r.json()
  assert(r.ok, 'seed role failed: ' + JSON.stringify(j))
  return j[0]
}
const roleAAdmin = await mkRole(cA.id, 'Admin', true)
const roleBEmp = await mkRole(cB.id, 'Employee', false)

// 3. auth users (employee in B, admin in A)
const mkAuth = async (email) => {
  const r = await fetch(`${API}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'RlsAudit12345x' }),
  })
  const j = await r.json()
  if (!j.user) throw new Error('signup failed ' + JSON.stringify(j))
  return j.user
}
const userA = await mkAuth(`admin-a-${suffix}@rlsaudit.test`)
const userB = await mkAuth(`emp-b-${suffix}@rlsaudit.test`)

// 4. profiles via service role
const mkUser = async (authId, companyId, roleId, email, fullName) => {
  const r = await rest('users', {
    method: 'POST',
    key: SERVICE,
    body: { auth_id: authId, company_id: companyId, role_id: roleId, email, full_name: fullName },
  })
  const j = await r.json()
  assert(r.ok, 'seed user failed: ' + JSON.stringify(j))
  return j[0]
}
const adminA = await mkUser(userA.id, cA.id, roleAAdmin.id, `admin-a-${suffix}@rlsaudit.test`, 'Admin A')
const empB = await mkUser(userB.id, cB.id, roleBEmp.id, `emp-b-${suffix}@rlsaudit.test`, 'Employee B')

// 5. login both (get JWTs)
const login = async (email) => {
  const r = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'RlsAudit12345x' }),
  })
  const j = await r.json()
  assert(j.access_token, 'login failed ' + JSON.stringify(j))
  return j.access_token
}
const tokA = await login(`admin-a-${suffix}@rlsaudit.test`)
const tokB = await login(`emp-b-${suffix}@rlsaudit.test`)

// Seed data to attempt leaks against
const attSeed = await rest('attendance_logs', {
  method: 'POST',
  key: SERVICE,
  body: { user_id: adminA.id, company_id: cA.id, clock_in_time: new Date().toISOString() },
})
const attSeedBody = await attSeed.json()
assert(attSeed.ok, 'seed attendance failed: ' + JSON.stringify(attSeedBody))
const attA = attSeedBody[0]
console.log(`seeded: companyA=${cA.slug} companyB=${cB.slug} adminA empB logA=${attA.id}`)

// ======== AUDIT: cross-tenant SELECT leaks ========
console.log('\n[A] Cross-tenant SELECT attempts (anon-key + user JWT)')
{
  // A1. Employee B tries reading company A's attendance logs
  let r = await rest(`attendance_logs?company_id=eq.${cA.id}`, { token: tokB })
  let rows = await r.json()
  check('empB cannot read companyA attendance', Array.isArray(rows) && rows.length === 0, `got ${Array.isArray(rows) ? rows.length : rows}`)

  // A2. Employee B tries reading company A's users
  r = await rest(`users?company_id=eq.${cA.id}`, { token: tokB })
  rows = await r.json()
  check('empB cannot read companyA users', Array.isArray(rows) && rows.length === 0)

  // A3. Employee B tries reading company A's tasks
  r = await rest(`tasks?company_id=eq.${cA.id}`, { token: tokB })
  rows = await r.json()
  check('empB cannot read companyA tasks', Array.isArray(rows) && rows.length === 0)

  // A4. Admin A reads own company users (should work)
  r = await rest(`users?company_id=eq.${cA.id}`, { token: tokA })
  rows = await r.json()
  check('adminA CAN read own users', Array.isArray(rows) && rows.length === 1)
}

console.log('\n[B] Cross-tenant WRITE attempts')
{
  // B1. Employee B tries inserting attendance into company A
  const r = await rest('attendance_logs', {
    method: 'POST',
    token: tokB,
    body: { user_id: adminA.id, company_id: cA.id, clock_in_time: new Date().toISOString() },
  })
  check('empB cannot insert into companyA attendance', r.status === 401 || r.status === 403, `status ${r.status}`)

  // B2. Employee B tries updating company A user profile
  const r2 = await rest(`users?id=eq.${adminA.id}`, {
    method: 'PATCH',
    token: tokB,
    body: { full_name: 'HACKED' },
  })
  check('empB cannot update companyA user', r2.status === 401 || r2.status === 403 || (await r2.json()).length === 0, `status ${r2.status}`)

  // B3. Employee B tries inserting a user row (client insert must be blocked)
  const r3 = await rest('users', {
    method: 'POST',
    token: tokB,
    body: { auth_id: userB.id, company_id: cA.id, role_id: roleBEmp.id, email: 'x@x.test', full_name: 'INJECT' },
  })
  check('empB cannot INSERT user rows via client', r3.status === 401 || r3.status === 403, `status ${r3.status}`)

  // B4. Anon (no login) tries reading users
  const r4 = await rest('users')
  const rows4 = await r4.json()
  check('anonymous cannot read users', r4.status === 401 || (Array.isArray(rows4) && rows4.length === 0))
}

console.log('\n[C] Tier/entitlement tamper attempts')
{
  // C1. Admin A tries upgrading own tier via client
  const r = await rest(`companies?id=eq.${cA.id}`, {
    method: 'PATCH',
    token: tokA,
    body: { tier: 'pro', active_modules: ['attendance', 'tasks', 'payroll', 'shifts'] },
  })
  const rows = await r.json().catch(() => [])
  check(
    'adminA cannot self-upgrade tier or force pro modules',
    r.status >= 400 || !rows.length || (rows[0].tier === 'free' && !rows[0].active_modules.some((m) => ['payroll', 'shifts'].includes(m))),
    `status ${r.status} rows ${JSON.stringify(rows).slice(0, 120)}`
  )

  // C2. Read-back: tier still free
  const r2 = await rest(`companies?id=eq.${cA.id}&select=tier,active_modules`, { token: tokA })
  const comp = (await r2.json())[0]
  check('companyA tier still free after tamper attempt', comp?.tier === 'free', JSON.stringify(comp))
}

console.log('\n[D] Deactivated employee lockout (is_active)')
{
  // Deactivate admin A via service role, then verify ALL reads now return
  // nothing. Since migration 20260910000016 the tenancy helpers return NULL
  // for deactivated users, so every RLS policy comparison fails.
  await rest(`users?id=eq.${adminA.id}`, { method: 'PATCH', key: SERVICE, body: { is_active: false } })
  const r = await rest(`users?company_id=eq.${cA.id}`, { token: tokA })
  const rows = await r.json()
  check('deactivated admin reads ZERO rows (hard RLS lockout)', Array.isArray(rows) && rows.length === 0, `got ${rows?.length}`)

  // Deactivated user cannot read their own attendance either
  const r2 = await rest(`attendance_logs?company_id=eq.${cA.id}`, { token: tokA })
  const rows2 = await r2.json()
  check('deactivated admin reads ZERO attendance rows', Array.isArray(rows2) && rows2.length === 0, `got ${rows2?.length}`)
  // restore
  await rest(`users?id=eq.${adminA.id}`, { method: 'PATCH', key: SERVICE, body: { is_active: true } })
}

// ======== SUMMARY ========
console.log('\n' + '='.repeat(50))
console.log(`PASS: ${results.pass.length}  FAIL: ${results.fail.length}`)
if (results.fail.length) {
  console.log('\nFAILED:')
  results.fail.forEach((f) => console.log('  - ' + f))
  process.exit(1)
}
console.log('RLS AUDIT: ALL CLEAN')

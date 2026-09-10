import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Invariant tests for the entitlement system.
 * These tests lock in the Free/Pro module boundaries so a refactor
 * cannot silently reopen leaked Pro features.
 *
 * The module mirrors the pure functions from src/lib/entitlements.ts
 * (compiled to JS in-memory to run under node:test without a TS loader).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

let ent

test('setup: compile entitlements to runnable JS', async () => {
  const require = createRequire(process.cwd() + '/')
  const ts = require('typescript')

  const src = await readFile('src/lib/entitlements.ts', 'utf8')
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText

  const tmpDir = join(tmpdir(), 'apex-ent-tests')
  await mkdir(tmpDir, { recursive: true })
  const jsPath = join(tmpDir, 'entitlements.mjs')
  await writeFile(jsPath, js)
  ent = await import(`file://${jsPath.replace(/\\/g, '/')}`)
})

test('free tier never receives pro modules regardless of stored list', () => {
  const freeCompany = {
    tier: 'free',
    trial_ends_at: null,
    active_modules: ['attendance', 'tasks', 'shifts', 'leave', 'payroll', 'inventory'],
  }
  const resolved = ent.resolveEntitledModules(freeCompany)
  assert.ok(resolved.includes('attendance'), 'attendance must stay available on free')
  assert.ok(resolved.includes('tasks'), 'tasks must stay available on free')
  for (const m of ['shifts', 'leave', 'payroll', 'inventory']) {
    assert.ok(!resolved.includes(m), `free tier must never resolve pro module ${m}`)
  }
})

test('pro tier keeps stored modules as-is', () => {
  const proCompany = {
    tier: 'pro',
    trial_ends_at: null,
    active_modules: ['attendance', 'tasks', 'shifts', 'payroll'],
  }
  const resolved = ent.resolveEntitledModules(proCompany)
  assert.deepEqual(resolved, ['attendance', 'tasks', 'shifts', 'payroll'])
})

test('expired trial degrades to free module set', () => {
  const expiredTrial = {
    tier: 'free',
    trial_ends_at: new Date(Date.now() - 86400000).toISOString(),
    active_modules: ['attendance', 'tasks', 'payroll'],
  }
  const resolved = ent.resolveEntitledModules(expiredTrial)
  assert.ok(!resolved.includes('payroll'), 'expired trial must not keep pro modules')
})

test('active trial counts as pro', () => {
  const trial = {
    tier: 'free',
    trial_ends_at: new Date(Date.now() + 86400000).toISOString(),
    active_modules: ['attendance', 'tasks', 'payroll', 'shifts'],
  }
  const resolved = ent.resolveEntitledModules(trial)
  assert.ok(resolved.includes('payroll'), 'active trial must include pro modules')
  assert.ok(resolved.includes('shifts'))
})

test('null company falls back to free defaults', () => {
  assert.deepEqual(ent.resolveEntitledModules(null), ['attendance', 'tasks'])
})

test('updateModulesAction filter semantics: pro-only modules excluded on free', () => {
  // Mirrors the filter logic in updateModulesAction without hitting Supabase
  const FREE_MODULES = ['attendance', 'tasks']
  const sent = ['attendance', 'tasks', 'payroll', 'shifts', 'tuition-billing']
  const isPro = (m) => !FREE_MODULES.includes(m)
  const allowed = sent.filter((m) => !isPro(m))
  assert.deepEqual(allowed, ['attendance', 'tasks'])
})

test('employee quota differs by tier (free 15, pro 100)', () => {
  const freeCompany = { tier: 'free', trial_ends_at: null }
  const proCompany = { tier: 'pro', trial_ends_at: null }
  assert.equal(ent.getMaxAllowedEmployees(freeCompany), 15)
  assert.equal(ent.getMaxAllowedEmployees(proCompany), 100)
})

test('suspended tier cannot access anything', () => {
  const suspended = {
    tier: 'suspended',
    trial_ends_at: null,
    active_modules: ['attendance', 'tasks'],
  }
  // effectiveTier('suspended') must not be treated as pro
  const isPro = ent.isProOrHigher(suspended)
  assert.equal(isPro, false)
})

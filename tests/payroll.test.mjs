import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(path.join(__dirname, p), 'utf8')

const kasbon = read('../supabase/migrations/20260910000009_kasbon.sql')
const thr = read('../supabase/migrations/20260910000010_thr.sql')
const ci = read('../.github/workflows/ci.yml')

describe('APEX Payroll Features (Kasbon & THR) Test Suite', () => {
  describe('1. Kasbon (Earned Wage Access) migration invariants', () => {
    it('creates kasbon_requests with positive amount, installment cap, and status whitelist', () => {
      assert.ok(kasbon.includes('CREATE TABLE public.kasbon_requests'))
      assert.ok(kasbon.includes('CHECK (amount > 0)'))
      assert.ok(kasbon.includes('CHECK (installment_count BETWEEN 1 AND 12)'))
      assert.ok(kasbon.includes("CHECK (status IN ('pending', 'approved', 'rejected', 'fully_repaid'))"))
    })

    it('scopes RLS to company + identity on every policy (WITH CHECK on all writes)', () => {
      assert.ok(kasbon.includes('ENABLE ROW LEVEL SECURITY'))
      assert.ok(kasbon.includes('company_id = public.get_company_id()'))
      assert.ok(kasbon.includes('user_id = public.get_user_id()'))
      assert.ok(kasbon.includes("status = 'pending' AND decided_by IS NULL"))
      const withChecks = kasbon.split('WITH CHECK').length - 1
      assert.ok(withChecks >= 3, `expected >= 3 WITH CHECK clauses, found ${withChecks}`)
    })

    it('guards repayments with a DB-enforced cap + parent consistency trigger', () => {
      assert.ok(kasbon.includes('CREATE TABLE public.kasbon_repayments'))
      assert.ok(kasbon.includes('enforce_kasbon_repayment_integrity'))
      assert.ok(kasbon.includes('Total cicilan melebihi nilai kasbon'))
      assert.ok(kasbon.includes('Data cicilan tidak cocok dengan kasbon induk'))
      assert.ok(kasbon.includes('TRIGGER tr_kasbon_repayment_integrity'))
    })

    it('indexes hot paths (repayments by kasbon, requests by company+user)', () => {
      assert.ok(kasbon.includes('CREATE INDEX idx_kasbon_repayments_kasbon'))
      assert.ok(kasbon.includes('CREATE INDEX idx_kasbon_requests_company_user'))
    })

    it('validates payroll_month format YYYY-MM on repayments', () => {
      assert.ok(kasbon.includes("payroll_month ~ '^[0-9]{4}-[0-9]{2}$'"))
    })
  })

  describe('2. THR (Tunjangan Hari Raya) migration invariants', () => {
    it('adds hire_date and fixed_allowance (prorate + wage basis inputs)', () => {
      assert.ok(thr.includes('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hire_date DATE'))
      assert.ok(thr.includes('ADD COLUMN IF NOT EXISTS fixed_allowance'))
    })

    it('blocks employees from rewriting their own hire_date (fraud guard)', () => {
      assert.ok(thr.includes('prevent_hire_date_tamper'))
      assert.ok(thr.includes("COALESCE(public.get_user_role(), '') NOT IN ('Admin', 'Manager')"))
    })

    it('enforces one THR payment per employee per year with admin-only writes', () => {
      assert.ok(thr.includes('UNIQUE (company_id, user_id, year)'))
      assert.ok(thr.includes('CREATE POLICY manage_thr_payments'))
      assert.ok(thr.includes("public.get_user_role() IN ('Admin', 'Manager')"))
      assert.ok(thr.includes('WITH CHECK'))
    })
  })

  describe('3. CI pipeline (.github/workflows/ci.yml)', () => {
    it('runs on push and PR with Node 24', () => {
      assert.ok(ci.includes('pull_request'))
      assert.ok(ci.includes('node-version: 24'))
    })

    it('runs tests, type check, lint, and build in order', () => {
      assert.ok(ci.includes('npm test'))
      assert.ok(ci.includes('tsc --noEmit'))
      assert.ok(ci.includes('npm run lint'))
      assert.ok(ci.includes('npm run build'))
    })
  })
})

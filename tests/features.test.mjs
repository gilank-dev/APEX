import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { parseCsv, rowsToEmployees } from '../src/lib/csv.ts'

const rootDir = path.resolve(import.meta.dirname, '..')

function extractExportedActions(filePath) {
  const content = fs.readFileSync(path.join(rootDir, filePath), 'utf8')
  const regex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g
  const matches = []
  let match
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      name: match[1],
      startIndex: match.index,
    })
  }

  return matches.map((fn, idx) => {
    const nextStart = idx + 1 < matches.length ? matches[idx + 1].startIndex : content.length
    const body = content.slice(fn.startIndex, nextStart)
    return {
      file: filePath,
      name: fn.name,
      body,
    }
  })
}

describe('APEX Features & P0 Sprint Test Suite', () => {
  describe('1. CSV Parsing (RFC4180) & Employee Extraction', () => {
    it('parses quoted fields with commas correctly', () => {
      const csv = 'full_name,email,role_name\n"Doe, John",john@example.com,Employee'
      const rows = parseCsv(csv)
      assert.deepStrictEqual(rows, [
        ['full_name', 'email', 'role_name'],
        ['Doe, John', 'john@example.com', 'Employee'],
      ])
    })

    it('parses escaped quotes ("") inside quoted fields', () => {
      const csv = 'full_name,email,role_name\n"John ""The Boss"" Doe",john@example.com,Manager'
      const rows = parseCsv(csv)
      assert.deepStrictEqual(rows, [
        ['full_name', 'email', 'role_name'],
        ['John "The Boss" Doe', 'john@example.com', 'Manager'],
      ])
    })

    it('parses CRLF and LF line endings correctly', () => {
      const csvCRLF = 'a,b\r\nc,d\r\ne,f'
      const rowsCRLF = parseCsv(csvCRLF)
      assert.deepStrictEqual(rowsCRLF, [
        ['a', 'b'],
        ['c', 'd'],
        ['e', 'f'],
      ])

      const csvLF = 'a,b\nc,d\ne,f'
      const rowsLF = parseCsv(csvLF)
      assert.deepStrictEqual(rowsLF, [
        ['a', 'b'],
        ['c', 'd'],
        ['e', 'f'],
      ])
    })

    it('skips UTF-8 BOM when present', () => {
      const csvWithBOM = '\uFEFFfull_name,email,role_name\nAlice,alice@example.com,Admin'
      const rows = parseCsv(csvWithBOM)
      assert.deepStrictEqual(rows[0], ['full_name', 'email', 'role_name'])
      assert.deepStrictEqual(rows[1], ['Alice', 'alice@example.com', 'Admin'])
    })

    it('rowsToEmployees extracts valid employees and defaults role to Employee', () => {
      const rows = [
        ['full_name', 'email', 'role_name'],
        ['Budi Santoso', 'budi@example.com', ''],
        ['Siti Rahma', 'siti@example.com', 'Manager'],
      ]
      const result = rowsToEmployees(rows, { limit: 200 })
      assert.strictEqual(result.errors.length, 0)
      assert.strictEqual(result.employees.length, 2)
      assert.strictEqual(result.employees[0].role_name, 'Employee')
      assert.strictEqual(result.employees[1].role_name, 'Manager')
    })

    it('rowsToEmployees validates full_name presence and max length of 100', () => {
      const rows = [
        ['full_name', 'email', 'role_name'],
        ['', 'no_name@example.com', 'Employee'],
        ['A'.repeat(101), 'long_name@example.com', 'Employee'],
        ['Valid Name', 'valid@example.com', 'Employee'],
      ]
      const result = rowsToEmployees(rows, { limit: 200 })
      assert.strictEqual(result.employees.length, 1)
      assert.strictEqual(result.employees[0].full_name, 'Valid Name')
      assert.strictEqual(result.errors.length, 2)
    })

    it('rowsToEmployees validates email regex and allows empty email for dummy account', () => {
      const rows = [
        ['full_name', 'email', 'role_name'],
        ['Dummy One', '', 'Employee'],
        ['Invalid Email User', 'not-an-email', 'Employee'],
        ['Valid Email User', 'valid.user@company.co.id', 'Employee'],
      ]
      const result = rowsToEmployees(rows, { limit: 200 })
      assert.strictEqual(result.employees.length, 2)
      assert.strictEqual(result.employees[0].full_name, 'Dummy One')
      assert.strictEqual(result.employees[0].email, '')
      assert.strictEqual(result.employees[1].full_name, 'Valid Email User')
      assert.strictEqual(result.errors.length, 1)
      assert.match(result.errors[0], /Format email.*tidak valid/)
    })

    it('rowsToEmployees dedupes by email within file', () => {
      const rows = [
        ['full_name', 'email', 'role_name'],
        ['First User', 'duplicate@example.com', 'Employee'],
        ['Second User', 'DUPLICATE@example.com', 'Employee'],
        ['Dummy 1', '', 'Employee'],
        ['Dummy 2', '', 'Employee'],
      ]
      const result = rowsToEmployees(rows, { limit: 200 })
      assert.strictEqual(result.employees.length, 3)
      assert.strictEqual(result.employees[0].full_name, 'First User')
      // Dummy accounts with empty emails are not filtered by deduplication
      assert.strictEqual(result.employees[1].full_name, 'Dummy 1')
      assert.strictEqual(result.employees[2].full_name, 'Dummy 2')
    })

    it('rowsToEmployees caps at 200 rows per import', () => {
      const rows = [['full_name', 'email', 'role_name']]
      for (let i = 0; i < 250; i++) {
        rows.push([`User ${i}`, `user${i}@example.com`, 'Employee'])
      }
      const result = rowsToEmployees(rows, { limit: 200 })
      assert.strictEqual(result.employees.length, 200)
    })
  })

  describe('2. Authorization Guards in Server Actions', () => {
    it('ensures leave-actions.ts actions have authorization guards before createAdminClient', () => {
      const leaveActions = extractExportedActions('src/lib/leave-actions.ts')
      assert.ok(leaveActions.length >= 3, 'Expected at least 3 exported actions in leave-actions.ts')

      for (const action of leaveActions) {
        const hasRequireManager = action.body.includes('requireManager(')
          || action.body.includes('requireModuleAccess(')
          || action.body.includes('requireMemberModuleAccess(')
        const hasGetCallerProfile = action.body.includes('getCallerProfile(')
        assert.ok(
          hasRequireManager || hasGetCallerProfile,
          `Action ${action.name} in leave-actions.ts lacks authorization guard`
        )

        const reqManagerIdx = action.body.indexOf('requireManager(')
        const getProfileIdx = action.body.indexOf('getCallerProfile(')
        const guardIndices = [reqManagerIdx, getProfileIdx].filter((i) => i !== -1)
        const firstGuardIdx = Math.min(...guardIndices)

        const adminClientIdx = action.body.indexOf('createAdminClient()')
        if (adminClientIdx !== -1) {
          assert.ok(
            firstGuardIdx < adminClientIdx,
            `In action ${action.name} (leave-actions.ts), createAdminClient() at index ${adminClientIdx} must appear AFTER authorization guard at index ${firstGuardIdx}`
          )
        }
      }
    })

    it('ensures shift-actions.ts swap actions have authorization guards before createAdminClient', () => {
      const shiftActions = extractExportedActions('src/lib/shift-actions.ts')
      const swapActionNames = [
        'createSwapRequestAction',
        'decideSwapRequestAction',
        'cancelSwapRequestAction',
      ]

      for (const name of swapActionNames) {
        const action = shiftActions.find((a) => a.name === name)
        assert.ok(action, `Action ${name} must be exported in shift-actions.ts`)

        const hasRequireManager = action.body.includes('requireManager(')
        const hasGetCallerProfile = action.body.includes('getCallerProfile(')
        assert.ok(
          hasRequireManager || hasGetCallerProfile,
          `Action ${name} in shift-actions.ts lacks authorization guard`
        )

        const reqManagerIdx = action.body.indexOf('requireManager(')
        const getProfileIdx = action.body.indexOf('getCallerProfile(')
        const guardIndices = [reqManagerIdx, getProfileIdx].filter((i) => i !== -1)
        const firstGuardIdx = Math.min(...guardIndices)

        const adminClientIdx = action.body.indexOf('createAdminClient()')
        if (adminClientIdx !== -1) {
          assert.ok(
            firstGuardIdx < adminClientIdx,
            `In action ${name} (shift-actions.ts), createAdminClient() at index ${adminClientIdx} must appear AFTER authorization guard at index ${firstGuardIdx}`
          )
        }
      }
    })

    it('ensures importEmployeesAction has requireManager guard before createAdminClient', () => {
      const adminActions = extractExportedActions('src/lib/admin-actions.ts')
      const importAction = adminActions.find((a) => a.name === 'importEmployeesAction')
      assert.ok(importAction, 'importEmployeesAction must be exported in admin-actions.ts')

      const reqManagerIdx = importAction.body.indexOf('requireManager(')
      assert.ok(reqManagerIdx !== -1, 'importEmployeesAction must call requireManager(')

      const adminClientIdx = importAction.body.indexOf('createAdminClient()')
      assert.ok(adminClientIdx !== -1, 'importEmployeesAction must use createAdminClient()')
      assert.ok(
        reqManagerIdx < adminClientIdx,
        `In importEmployeesAction, createAdminClient() must appear AFTER requireManager(`
      )
    })
  })

  describe('3. Database Migrations Security & RLS Invariants', () => {
    it('ensures leave migration contains WITH CHECK / USING clauses and get_company_id()', () => {
      const migrationPath = path.join(rootDir, 'supabase/migrations/20260909000005_leave.sql')
      assert.ok(fs.existsSync(migrationPath), 'Leave migration must exist')
      const content = fs.readFileSync(migrationPath, 'utf8')

      assert.ok(content.includes('USING'), 'Leave migration must contain USING clauses')
      assert.ok(content.includes('WITH CHECK'), 'Leave migration must contain WITH CHECK clauses')
      assert.ok(content.includes('get_company_id()'), 'Leave migration must reference get_company_id()')
    })

    it('ensures shift_swap migration contains WITH CHECK / USING clauses and get_company_id()', () => {
      const migrationPath = path.join(rootDir, 'supabase/migrations/20260909000006_shift_swap.sql')
      assert.ok(fs.existsSync(migrationPath), 'Shift swap migration must exist')
      const content = fs.readFileSync(migrationPath, 'utf8')

      assert.ok(content.includes('USING'), 'Shift swap migration must contain USING clauses')
      assert.ok(content.includes('WITH CHECK'), 'Shift swap migration must contain WITH CHECK clauses')
      assert.ok(content.includes('get_company_id()'), 'Shift swap migration must reference get_company_id()')
    })
  })

  describe('4. Indonesian Copy Markers in Client Pages', () => {
    it('ensures leave page + LeaveClient contain Indonesian copy marker "Cuti"', () => {
      const leavePagePath = path.join(rootDir, 'src/app/[slug]/leave/page.tsx')
      const leaveClientPath = path.join(rootDir, 'src/app/[slug]/leave/LeaveClient.tsx')

      assert.ok(fs.existsSync(leavePagePath), 'leave/page.tsx must exist')
      assert.ok(fs.existsSync(leaveClientPath), 'LeaveClient.tsx must exist')

      const pageContent = fs.readFileSync(leavePagePath, 'utf8')
      const clientContent = fs.readFileSync(leaveClientPath, 'utf8')

      assert.ok(pageContent.includes('Cuti'), 'leave/page.tsx must contain "Cuti"')
      assert.ok(clientContent.includes('Cuti'), 'LeaveClient.tsx must contain "Cuti"')
    })

    it('ensures ShiftsClient contains Indonesian copy marker "Tukar Shift"', () => {
      const shiftsClientPath = path.join(rootDir, 'src/app/[slug]/shifts/ShiftsClient.tsx')
      assert.ok(fs.existsSync(shiftsClientPath), 'ShiftsClient.tsx must exist')
      const content = fs.readFileSync(shiftsClientPath, 'utf8')

      assert.ok(content.includes('Tukar Shift'), 'ShiftsClient.tsx must contain "Tukar Shift"')
    })
  })
})

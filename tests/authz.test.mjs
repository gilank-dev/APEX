import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(import.meta.dirname, '..')

describe('APEX Authorization Guard Test Suite', () => {
  describe('1. Auth Guard Module (src/lib/authz.ts)', () => {
    it('exists and does not contain use server directive', () => {
      const authzPath = path.join(rootDir, 'src/lib/authz.ts')
      assert.ok(fs.existsSync(authzPath), 'src/lib/authz.ts must exist')
      const content = fs.readFileSync(authzPath, 'utf8')
      assert.strictEqual(
        content.includes("'use server'") || content.includes('"use server"'),
        false,
        'src/lib/authz.ts must NOT have use server directive'
      )
    })

    it('exports getCallerProfile and requireManager', () => {
      const authzPath = path.join(rootDir, 'src/lib/authz.ts')
      const content = fs.readFileSync(authzPath, 'utf8')

      assert.match(
        content,
        /export\s+async\s+function\s+getCallerProfile\b/,
        'src/lib/authz.ts must export getCallerProfile'
      )
      assert.match(
        content,
        /export\s+async\s+function\s+requireManager\b/,
        'src/lib/authz.ts must export requireManager'
      )
      assert.match(
        content,
        /export\s+interface\s+CallerProfile\b/,
        'src/lib/authz.ts must export CallerProfile interface'
      )
    })
  })

  describe('2. Static Analysis of Action Guards', () => {
    const actionFiles = [
      'src/lib/shift-actions.ts',
      'src/lib/payroll-actions.ts',
      'src/lib/admin-actions.ts',
    ]

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

    it('asserts that action files contain expected exported actions', () => {
      for (const file of actionFiles) {
        const actions = extractExportedActions(file)
        assert.ok(actions.length > 0, `Expected exported actions in ${file}`)
      }
    })

    it('ensures every exported action has an authorization guard before createAdminClient', () => {
      const allActions = actionFiles.flatMap(extractExportedActions)
      assert.strictEqual(allActions.length, 10, 'Expected exactly 10 exported actions across the 3 files')

      for (const action of allActions) {
        const hasRequireManager = action.body.includes('requireManager(')
        const hasGetCallerProfile = action.body.includes('getCallerProfile()')

        // 1 & 3. Action must have an authorization guard
        assert.ok(
          hasRequireManager || hasGetCallerProfile,
          `Action ${action.name} in ${action.file} lacks an authorization guard (requireManager or getCallerProfile)`
        )

        // 2. createAdminClient() appears only AFTER the guard call
        const reqManagerIdx = action.body.indexOf('requireManager(')
        const getProfileIdx = action.body.indexOf('getCallerProfile()')
        const guardIndices = [reqManagerIdx, getProfileIdx].filter((i) => i !== -1)
        const firstGuardIdx = Math.min(...guardIndices)

        const adminClientIdx = action.body.indexOf('createAdminClient()')
        if (adminClientIdx !== -1) {
          assert.ok(
            firstGuardIdx < adminClientIdx,
            `In action ${action.name} (${action.file}), createAdminClient() at index ${adminClientIdx} must appear AFTER the authorization guard at index ${firstGuardIdx}`
          )
        }
      }
    })

    it('ensures resetDummyPasswordAction and regenerateInviteCodeAction specifically use getCallerProfile', () => {
      const adminActions = extractExportedActions('src/lib/admin-actions.ts')

      const resetAction = adminActions.find((a) => a.name === 'resetDummyPasswordAction')
      assert.ok(resetAction, 'resetDummyPasswordAction must exist')
      assert.ok(
        resetAction.body.includes('getCallerProfile()'),
        'resetDummyPasswordAction must use getCallerProfile()'
      )

      const regenAction = adminActions.find((a) => a.name === 'regenerateInviteCodeAction')
      assert.ok(regenAction, 'regenerateInviteCodeAction must exist')
      assert.ok(
        regenAction.body.includes('getCallerProfile()'),
        'regenerateInviteCodeAction must use getCallerProfile()'
      )
    })
  })
})

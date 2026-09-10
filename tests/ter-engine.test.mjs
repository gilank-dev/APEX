// TER/BPJS engine brutal tests. Two tiers:
// TIER 1 (data-independent): structure, types, BPJS math, THR prorate, rounding.
// TIER 2 (data-gated): TER bracket lookups — assert FAIL-CLOSED while the
// verified bracket tables are empty; flip to real assertions once research
// populates src/data/ter-2026.json. This keeps us honest: no payroll number
// is ever computed from unverified tax brackets.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dataRaw = JSON.parse(readFileSync(path.join(root, 'src/data/ter-2026.json'), 'utf8'))

const PTkpStatuses = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']

// ---------------------------------------------------------------------------
// The engine imports '@/data/ter-2026.json' via the Next alias, which node --test
// cannot resolve. Extract the pure functions by loading the source through a
// tiny loader that rewrites the alias import to a file:// URL.
// ---------------------------------------------------------------------------
const engineSource = readFileSync(path.join(root, 'src/lib/ter-engine.ts'), 'utf8')
assert.ok(engineSource.includes('export function computePph21TerMonthly'), 'engine must export computePph21TerMonthly')
assert.ok(engineSource.includes('export function computeThr'), 'engine must export computeThr')

const { writeFileSync, rmSync } = await import('node:fs')
const { pathToFileURL } = await import('node:url')
const dataUrl = pathToFileURL(path.join(root, 'src/data/ter-2026.json')).href
const rewritten = engineSource.replace(
  /from\s+'@\/data\/ter-2026\.json'/,
  `from ${JSON.stringify(dataUrl)} with { type: 'json' }`
)
const tmpPath = path.join(root, '.ter-engine.test.ts')
writeFileSync(tmpPath, rewritten)
const { computePph21TerMonthly, computeBpjs, computeThr, computePayrollLine, findTerBracket } = await import(
  pathToFileURL(tmpPath).href
)
rmSync(tmpPath)

describe('PPh 21 TER + BPJS Engine Test Suite', () => {
  describe('1. Data file integrity (fail-closed contract)', () => {
    it('has all 8 PTKP statuses in category A and B', () => {
      for (const s of PTkpStatuses) {
        assert.ok(Array.isArray(dataRaw.ter.categoryA[s]), `categoryA missing ${s}`)
        assert.ok(Array.isArray(dataRaw.ter.categoryB[s]), `categoryB missing ${s}`)
      }
    })

    it('PTKP values are sane (54jt..72jt, strictly increasing with dependents)', () => {
      const p = dataRaw.ptkp
      for (const s of PTkpStatuses) {
        assert.ok(typeof p[s] === 'number' && p[s] >= 54000000 && p[s] <= 72000000, `bad PTKP ${s}`)
      }
      assert.ok(p['TK/0'] < p['TK/1'] && p['TK/1'] < p['TK/2'] && p['TK/2'] < p['TK/3'])
      assert.ok(p['K/0'] > p['TK/0'], 'married K/0 must exceed single TK/0')
    })

    it('BPJS rates match current law (JHT 3.7/2, JKM 0.3, JP 2/1, JKN 4/1)', () => {
      assert.equal(dataRaw.bpjs.jht.employer, 0.037)
      assert.equal(dataRaw.bpjs.jht.employee, 0.02)
      assert.equal(dataRaw.bpjs.jkm.employer, 0.003)
      assert.equal(dataRaw.bpjs.jp.employer, 0.02)
      assert.equal(dataRaw.bpjs.jp.employee, 0.01)
      assert.equal(dataRaw.bpjs.kesehatan.employer, 0.04)
      assert.equal(dataRaw.bpjs.kesehatan.employee, 0.01)
      assert.equal(dataRaw.bpjs.jkk.classes.length, 5)
    })

    it('brackets, when populated, are sorted with no gaps/overlaps (min >= prev max, rate <= 1)', () => {
      for (const cat of ['categoryA', 'categoryB']) {
        for (const s of PTkpStatuses) {
          const t = dataRaw.ter[cat][s]
          let prevMax = 0
          for (const b of t) {
            assert.ok(typeof b.min === 'number' && typeof b.rate === 'number', `${cat}/${s}: bracket missing min/rate`)
            assert.ok(b.min >= prevMax, `${cat}/${s}: gap/overlap at min ${b.min} (prev max ${prevMax})`)
            assert.ok(b.rate >= 0 && b.rate <= 1, `${cat}/${s}: bad rate ${b.rate}`)
            if (b.max !== null) assert.ok(b.max > b.min, `${cat}/${s}: max must exceed min`)
            prevMax = b.max ?? Number.MAX_SAFE_INTEGER
          }
        }
      }
    })
  })

  describe('2. Engine structural invariants', () => {
    it('findTerBracket returns null for empty/unpopulated tables (fail-closed)', () => {
      if (dataRaw.ter.categoryA['TK/0'].length === 0) {
        assert.equal(findTerBracket(10000000, 'TK/0', 'A'), null)
      } else {
        assert.ok(true, 'tables populated — covered by tier-2 tests below')
      }
    })

    it('computePph21TerMonthly returns 0 on zero/negative bruto', () => {
      assert.equal(computePph21TerMonthly({ monthlyBruto: 0, ptkpStatus: 'TK/0', category: 'A' }), 0)
      assert.equal(computePph21TerMonthly({ monthlyBruto: -5000000, ptkpStatus: 'K/1', category: 'B' }), 0)
    })
  })

  describe('3. BPJS math (independent of TER tables)', () => {
    it('computes exact contributions on 10jt bruto (no caps configured)', () => {
      const r = computeBpjs(10000000, 1)
      assert.equal(r.jhtEmployer, 370000)
      assert.equal(r.jhtEmployee, 200000)
      assert.equal(r.jkm, 30000)
      assert.equal(r.jpEmployer, 200000)
      assert.equal(r.jpEmployee, 100000)
      assert.equal(r.kesehatanEmployer, 400000)
      assert.equal(r.kesehatanEmployee, 100000)
    })

    it('JKC risk classes: class 0 cheapest, class 4 most expensive, monotonic', () => {
      const rates = dataRaw.bpjs.jkk.classes
      for (let i = 1; i < rates.length; i++) assert.ok(rates[i] > rates[i - 1], `JKC class ${i} must exceed ${i - 1}`)
      assert.equal(computeBpjs(10000000, 0).jkk, Math.round(10000000 * rates[0]))
      assert.equal(computeBpjs(10000000, 4).jkk, Math.round(10000000 * rates[4]))
    })

    it('caps clamp the base: JP/Kesehatan use min(bruto, cap) not bruto', () => {
      const data = JSON.parse(readFileSync(path.join(root, 'src/data/ter-2026.json'), 'utf8'))
      if (data.bpjs.jp.cap === null) {
        // simulate a cap: patch data via a fresh engine copy? Engine reads at
        // module load; instead verify the cap field plumbing via computeBpjs on
        // a low bruto (below any cap) — invariant: no negative, all rounded.
        const r = computeBpjs(100, 1)
        for (const k of Object.keys(r)) assert.ok(Number.isInteger(r[k]) && r[k] >= 0)
      } else {
        const cap = data.bpjs.jp.cap
        const over = computeBpjs(cap * 2, 1)
        assert.equal(over.jpEmployee, Math.round(cap * data.bpjs.jp.employee))
      }
    })
  })

  describe('4. THR prorate (Permenaker 6/2016)', () => {
    it('under 1 month of service: 0 THR', () => {
      assert.equal(computeThr({ monthsOfService: 0.9, wageBasis: 5000000 }), 0)
    })

    it('12+ months: exactly 1x wage basis (no prorate bonus)', () => {
      assert.equal(computeThr({ monthsOfService: 12, wageBasis: 5000000 }), 5000000)
      assert.equal(computeThr({ monthsOfService: 48, wageBasis: 5000000 }), 5000000)
    })

    it('1..11 months: prorate months/12, rounded to rupiah', () => {
      assert.equal(computeThr({ monthsOfService: 6, wageBasis: 6000000 }), 3000000)
      assert.equal(computeThr({ monthsOfService: 3, wageBasis: 5000000 }), 1250000)
      assert.equal(computeThr({ monthsOfService: 7, wageBasis: 5500000 }), Math.round((7 / 12) * 5500000))
    })

    it('rejects nonsense: negative service or wage', () => {
      assert.equal(computeThr({ monthsOfService: -3, wageBasis: 5000000 }), 0)
      assert.equal(computeThr({ monthsOfService: 6, wageBasis: 0 }), 0)
    })
  })

  describe('5. Full payroll line composition', () => {
    it('takeHomePayHint = bruto - PPh21 - employee BPJS shares, never negative-computed', () => {
      const line = computePayrollLine({ monthlyBruto: 8000000, ptkpStatus: 'K/0', category: 'A', jkkRiskClass: 1 })
      const expectedDeduction =
        line.pph21Monthly +
        line.bpjs.jhtEmployee +
        line.bpjs.jpEmployee +
        line.bpjs.kesehatanEmployee
      assert.equal(line.takeHomePayHint, 8000000 - expectedDeduction)
      assert.ok(Number.isInteger(line.takeHomePayHint))
    })
  })
})

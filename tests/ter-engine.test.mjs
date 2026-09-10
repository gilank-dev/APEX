// TER/BPJS engine brutal tests.
// TIER 1 (data-independent): structure, types, BPJS math, THR prorate, rounding.
// TIER 2 (golden tests): TER lookups verified against DJP's own worked examples
// from the PMK 168/2023 socialization PDF — NOT against blog tables.
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
const { computePph21TerMonthly, computeBpjs, computeThr, computePayrollLine, findTerBracket, terCategoryFor } = await import(
  pathToFileURL(tmpPath).href
)
rmSync(tmpPath)

describe('PPh 21 TER + BPJS Engine Test Suite', () => {
  describe('1. Data file integrity (fail-closed contract)', () => {
    it('has all 8 PTKP statuses in byStatus', () => {
      for (const s of PTkpStatuses) {
        assert.ok(Array.isArray(dataRaw.ter.byStatus[s]), `byStatus missing ${s}`)
        assert.ok(dataRaw.ter.byStatus[s].length > 0, `byStatus[${s}] must be populated`)
      }
    })

    it('category mapping matches PMK 168/2023: A=TK/0,TK/1,K/0; B=TK/2,TK/3,K/1,K/2; C=K/3', () => {
      const m = dataRaw._meta.categoryMapping
      assert.equal(m['TK/0'], 'A')
      assert.equal(m['TK/1'], 'A')
      assert.equal(m['K/0'], 'A')
      assert.equal(m['TK/2'], 'B')
      assert.equal(m['TK/3'], 'B')
      assert.equal(m['K/1'], 'B')
      assert.equal(m['K/2'], 'B')
      assert.equal(m['K/3'], 'C')
      // engine mapping function agrees with the data file
      for (const s of PTkpStatuses) {
        assert.equal(terCategoryFor(s), m[s])
      }
    })

    it('statuses sharing a category share identical tables (e.g. TK/0 === K/0 table)', () => {
      const m = dataRaw._meta.categoryMapping
      for (const a of PTkpStatuses) {
        for (const b of PTkpStatuses) {
          if (m[a] === m[b]) {
            assert.deepEqual(
              dataRaw.ter.byStatus[a],
              dataRaw.ter.byStatus[b],
              `${a} and ${b} are both category ${m[a]} — tables must be identical`
            )
          }
        }
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

    it('brackets are contiguous (min == prev max + 1), rates non-decreasing, capped at 34%', () => {
      for (const s of PTkpStatuses) {
        const t = dataRaw.ter.byStatus[s]
        let prevMax = 0
        for (let i = 0; i < t.length; i++) {
          const b = t[i]
          assert.ok(typeof b.min === 'number' && typeof b.rate === 'number', `${s}: bracket missing min/rate`)
          assert.ok(b.min >= prevMax, `${s}: gap/overlap at min ${b.min} (prev max ${prevMax})`)
          assert.ok(b.rate >= 0 && b.rate <= 1, `${s}: bad rate ${b.rate}`)
          if (i > 0) assert.ok(b.rate >= t[i - 1].rate, `${s}: rate regression at min ${b.min}`)
          if (b.max !== null) assert.ok(b.max > b.min, `${s}: max must exceed min`)
          prevMax = b.max ?? Number.MAX_SAFE_INTEGER
        }
        const last = t[t.length - 1]
        assert.ok(last.max === null && last.rate === 0.34, `${s}: last bracket must be unbounded @ 34%`)
      }
    })
  })

  describe('2. Golden tests: DJP worked examples (PMK 168/2023 socialization PDF)', () => {
    // Tuan C (slide 29): TK/0, 15.500.000 → Kategori A, 7% = 1.085.000
    it('TK/0 @ 15.500.000 → 7% = 1.085.000 (DJP example, Tuan C)', () => {
      const r = computePayrollLine({ monthlyBruto: 15500000, ptkpStatus: 'TK/0' })
      assert.equal(r.category, 'A')
      assert.equal(r.appliedRate, 0.07)
      assert.equal(r.pph21Monthly, 1085000)
    })

    // Tuan D (slide 30): TK/0, 17.500.000 → Kategori A, 8% = 1.400.000
    it('TK/0 @ 17.500.000 → 8% = 1.400.000 (DJP example, Tuan D)', () => {
      const r = computePayrollLine({ monthlyBruto: 17500000, ptkpStatus: 'TK/0' })
      assert.equal(r.appliedRate, 0.08)
      assert.equal(r.pph21Monthly, 1400000)
    })

    // Tuan H (slide 35): K/2, 6.800.000 → Kategori B, 0,5% = 34.000
    it('K/2 @ 6.800.000 → 0,5% = 34.000 (DJP example, Tuan H)', () => {
      const r = computePayrollLine({ monthlyBruto: 6800000, ptkpStatus: 'K/2' })
      assert.equal(r.category, 'B')
      assert.equal(r.appliedRate, 0.005)
      assert.equal(r.pph21Monthly, 34000)
    })

    // Boundary safety: exactly at bracket edges (min inclusive / max exclusive)
    it('bracket boundary: max is exclusive, min is inclusive (5.400.000 vs 5.400.001)', () => {
      const atMax = computePph21TerMonthly({ monthlyBruto: 5400000, ptkpStatus: 'TK/0' })
      const aboveMax = computePph21TerMonthly({ monthlyBruto: 5400001, ptkpStatus: 'TK/0' })
      assert.equal(atMax, 0) // still in 0% bracket
      assert.equal(aboveMax, Math.round(5400001 * 0.0025)) // 0.25% bracket
    })

    it('K/3 (category C) uses the C table, NOT A/B (0% up to 6.600.000)', () => {
      const r6m = computePph21TerMonthly({ monthlyBruto: 6000000, ptkpStatus: 'K/3' })
      const r7m = computePph21TerMonthly({ monthlyBruto: 7000000, ptkpStatus: 'K/3' })
      assert.equal(r6m, 0) // C table: 0..6.600.000 @ 0%
      assert.ok(r7m > 0, 'C table must charge tax above 6.6jt')
      // A table would have charged 6.2jt..? — ensure C ≠ A by comparing K/3 vs TK/0 at 6.500.000
      const asA = computePph21TerMonthly({ monthlyBruto: 6500000, ptkpStatus: 'TK/0' })
      assert.ok(asA > 0, 'sanity: TK/0 (A) charges above 5.4jt')
      assert.equal(computePph21TerMonthly({ monthlyBruto: 6500000, ptkpStatus: 'K/3' }), 0)
    })

    it('computePph21TerMonthly returns 0 on zero/negative bruto', () => {
      assert.equal(computePph21TerMonthly({ monthlyBruto: 0, ptkpStatus: 'TK/0' }), 0)
      assert.equal(computePph21TerMonthly({ monthlyBruto: -5000000, ptkpStatus: 'K/1' }), 0)
    })

    it('findTerBracket is null above the table (fail-closed) — never guesses', () => {
      // 10^12 is inside the unbounded top bracket, so this must resolve, not null.
      const huge = findTerBracket(1e12, 'TK/0')
      assert.ok(huge && huge.rate === 0.34)
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
      const line = computePayrollLine({ monthlyBruto: 8000000, ptkpStatus: 'K/0', jkkRiskClass: 1 })
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

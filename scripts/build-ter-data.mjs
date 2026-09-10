#!/usr/bin/env node
/**
 * Build src/data/ter-2026.json from verified sources.
 *
 * Sources:
 *  - research/payroll-2026-params.json — TER A & B tables (verified against
 *    3 DJP worked examples from the PMK 168/2023 socialization PDF), PTKP,
 *    BPJS rates & ceilings.
 *  - research/pph21-pkg/package/dist/index.js — npm package `pph21` whose
 *    tables are integrity-tested against the official PMK 168/2023 lampiran.
 *    Used for TER C (K/3) because the research JSON's categoryC.brackets was
 *    a stale duplicate of table A (WRONG — see below).
 *
 * Correct category mapping per PMK 168/2023 (verified from the official PDF):
 *   A: TK/0, TK/1, K/0
 *   B: TK/2, TK/3, K/1, K/2
 *   C: K/3
 * The old engine wrongly treated category as an independent NPWP-based input
 * with a 1.2x multiplier — that conflated the TER category (PTKP-derived)
 * with the non-NPWP surcharge (which never applies to TER for pegawai tetap
 * per PMK 168/2023; non-NPWP only hits Pasal 17 withholding).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ROOT = path.resolve(__dirname, '..')
const research = JSON.parse(fs.readFileSync(path.join(ROOT, 'research/payroll-2026-params.json'), 'utf8'))
const pkgSrc = fs.readFileSync(path.join(ROOT, 'research/pph21-pkg/package/dist/index.js'), 'utf8')

// --- extract TER_C from the pph21 package (minified scientific notation) ---
function extractTable(name) {
  const start = pkgSrc.indexOf(`${name} = [`)
  if (start === -1) throw new Error(`${name} not found in pph21 dist`)
  const open = pkgSrc.indexOf('[', start)
  // find matching closing bracket
  let depth = 0
  let end = -1
  for (let i = open; i < pkgSrc.length; i++) {
    if (pkgSrc[i] === '[') depth++
    else if (pkgSrc[i] === ']') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }
  if (end === -1) throw new Error(`unterminated table ${name}`)
  const body = pkgSrc.slice(open, end + 1)
  // safe-eval the literal (it only contains numbers/identifiers)
  const brackets = Function('"use strict"; return (' + body + ')')()
  return brackets.map((b) => ({ min: b.min, max: b.max, rate: b.rate }))
}

const terC = extractTable('TER_C_2024')
console.log(`extracted TER_C: ${terC.length} brackets, first=${JSON.stringify(terC[0])}, last=${JSON.stringify(terC[terC.length - 1])}`)

// sanity: structural integrity of TER C (per PMK 168/2023 lampiran layout)
if (terC[0].min !== 0 || terC[0].max !== 6600000 || terC[0].rate !== 0) {
  throw new Error('TER C first bracket mismatch vs PMK 168/2023 (0-6.600.000 @ 0%)')
}
for (let i = 1; i < terC.length; i++) {
  if (terC[i].min !== terC[i - 1].max + 1) {
    throw new Error(`TER C boundary gap/overlap at index ${i}: ${JSON.stringify(terC[i - 1])} -> ${JSON.stringify(terC[i])}`)
  }
  if (terC[i].rate < terC[i - 1].rate) {
    throw new Error(`TER C rate regression at index ${i}`)
  }
}
const lastC = terC[terC.length - 1]
if (lastC.max !== null || lastC.rate !== 0.34) {
  throw new Error(`TER C last bracket must be unbounded @ 34%, got ${JSON.stringify(lastC)}`)
}

// cross-check TER A & B from research against the package too (defense in depth)
const terA_pkg = extractTable('TER_A_2024')
const terB_pkg = extractTable('TER_B_2024')
const same = (a, b) => a.length === b.length && a.every((x, i) =>
  x.min === b[i].min && x.max === b[i].max && x.rate === b[i].rate)
console.log('research A === pkg A:', same(research.ter.categoryA['TK/0'], terA_pkg))
console.log('research B === pkg B:', same(research.ter.categoryB['TK/2'], terB_pkg))

// PTKP→category mapping per PMK 168/2023
const CATEGORY_FOR_PTKP = {
  'TK/0': 'A', 'TK/1': 'A', 'K/0': 'A',
  'TK/2': 'B', 'TK/3': 'B', 'K/1': 'B', 'K/2': 'B',
  'K/3': 'C',
}

// build final data: per-status table = the category table of its category
function tablesForCategory(cat) {
  if (cat === 'A') return terA_pkg
  if (cat === 'B') return terB_pkg
  return terC
}

const byStatus = {}
for (const [status, cat] of Object.entries(CATEGORY_FOR_PTKP)) {
  byStatus[status] = tablesForCategory(cat)
}

const out = {
  _meta: {
    generatedFrom: 'research/payroll-2026-params.json (TER A/B verified vs 3 DJP worked examples) + npm pph21@1.0.1 TER_C_2024 (integrity-tested vs PMK 168/2023 lampiran)',
    categoryMapping: CATEGORY_FOR_PTKP,
    note: 'TER categories are DERIVED from PTKP status (PMK 168/2023): A=TK/0,TK/1,K/0; B=TK/2,TK/3,K/1,K/2; C=K/3. Category is NOT NPWP-based.',
    asOf: research.asOf || '2026-09-10',
  },
  ter: {
    byStatus,
    boundaryConvention: 'min INCLUSIVE, max EXCLUSIVE (5.400.001 s.d. 5.650.000 per PMK 168/2023 lampiran layout)',
  },
  ptkp: research.ptkp,
  bpjs: research.bpjs,
}

fs.writeFileSync(path.join(ROOT, 'src/data/ter-2026.json'), JSON.stringify(out, null, 2) + '\n')
console.log('wrote src/data/ter-2026.json:', fs.statSync(path.join(ROOT, 'src/data/ter-2026.json')).size, 'bytes')

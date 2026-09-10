// PPh 21 TER (Tarif Efektif Rata-rata) + BPJS calculation engine.
// Legal basis: PP 58/2023 + PMK 168/2023 (TER bulanan), UU SJSN + Perpres/Permenaker
// for BPJS rates. Tables live in data/ter-2026.json — verified research artifact,
// never hand-typed into code.
//
// ponytail scope: monthly TER withholding for employee payroll runs. Annual
// reconciliation (SPT 1721) and non-employee withholding (PPh 21 final 50%)
// are OUT until a paying customer asks.

import terData from '@/data/ter-2026.json'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PtkpStatus = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3'
export type TerCategory = 'A' | 'B' | 'C'

export interface TerBracket {
  min: number
  max: number | null // null = unbounded
  rate: number // decimal fraction, e.g. 0.0025 = 0.25%
}

export interface BpjsConfig {
  jht: { employer: number; employee: number }
  jkk: { classes: number[] } // 5 risk classes, employer-paid
  jkm: { employer: number }
  jp: { employer: number; employee: number; cap: number | null }
  kesehatan: { employer: number; employee: number; cap: number | null }
}

export interface TerEngineInput {
  monthlyBruto: number // gaji pokok + tunjangan tetap + lembur + premTHR (Rp)
  ptkpStatus: PtkpStatus
  category: TerCategory // A: NPWP+KITAS/KITAP, B: NPWP only, C: no NPWP
  jkkRiskClass?: 0 | 1 | 2 | 3 | 4 // index into jkk.classes, default 1 (class II)
}

export interface TerEngineResult {
  pph21Monthly: number
  appliedRate: number
  bracket: TerBracket | null
  // BPJS breakdown (employer/employee shares) for the same bruto basis
  bpjs: {
    jhtEmployer: number; jhtEmployee: number
    jkk: number
    jkm: number
    jpEmployer: number; jpEmployee: number
    kesehatanEmployer: number; kesehatanEmployee: number
  }
  takeHomePayHint: number // bruto - employee-side deductions (PPh21 + employee BPJS)
}

// ---------------------------------------------------------------------------
// Data loading — from the verified research JSON
// ---------------------------------------------------------------------------

const data = terData as {
  ter: {
    categoryA: Record<PtkpStatus, TerBracket[]>
    categoryB: Record<PtkpStatus, TerBracket[]>
    categoryC: { rule: string; multiplier: number | null }
    boundaryConvention: string
  }
  ptkp: Record<PtkpStatus, number>
  bpjs: BpjsConfig
}

const CATEGORY_TABLES = {
  A: data.ter.categoryA,
  B: data.ter.categoryB,
} as const

export const BOUNDARY_CONVENTION = data.ter.boundaryConvention
export const PTKP_TABLE = data.ptkp
export const BPJS_TABLE = data.bpjs

// ---------------------------------------------------------------------------
// Core: TER lookup
// ---------------------------------------------------------------------------

/**
 * Find the TER bracket for a monthly bruto. Convention (per PP 58/2023):
 * `min` is EXCLUSIVE, `max` is INCLUSIVE unless the data's boundaryConvention
 * states otherwise — normalize once at load so the lookup is convention-safe.
 */
export function findTerBracket(
  monthlyBruto: number,
  ptkpStatus: PtkpStatus,
  category: TerCategory
): TerBracket | null {
  const table = category === 'C' ? CATEGORY_TABLES.B[ptkpStatus] : CATEGORY_TABLES[category][ptkpStatus]
  if (!table) return null
  const brackets = table as TerBracket[]

  // Data convention: min inclusive, max exclusive (upper bound not included).
  // We search for the bracket where min <= bruto < max (or max == null).
  for (const b of brackets) {
    const aboveMin = monthlyBruto >= b.min
    const belowMax = b.max === null || monthlyBruto < b.max
    if (aboveMin && belowMax) return b
  }
  return null
}

// ---------------------------------------------------------------------------
// Core: monthly PPh 21 TER
// ---------------------------------------------------------------------------

export function computePph21TerMonthly(input: TerEngineInput): number {
  const { monthlyBruto, ptkpStatus, category } = input

  if (monthlyBruto <= 0) return 0

  const bracket = findTerBracket(monthlyBruto, ptkpStatus, category)
  if (!bracket) return 0

  let rate = bracket.rate

  // Category C: no NPWP — 20% surcharge on the Category B rate (§22 PMK 168/2023)
  if (category === 'C') {
    const multiplier = data.ter.categoryC.multiplier ?? 1.2
    rate = Math.min(1, rate * multiplier)
  }

  // TER is a flat effective rate applied to the full monthly bruto —
  // NOT a progressive computation. One multiplication, then round to rupiah.
  return Math.round(monthlyBruto * rate)
}

// ---------------------------------------------------------------------------
// Core: BPJS contributions
// ---------------------------------------------------------------------------

function cappedBase(bruto: number, cap: number | null): number {
  if (cap === null || cap <= 0) return bruto
  return Math.min(bruto, cap)
}

export function computeBpjs(
  monthlyBruto: number,
  jkkRiskClass: 0 | 1 | 2 | 3 | 4 = 1
) {
  const b = data.bpjs
  const jpBase = cappedBase(monthlyBruto, b.jp.cap)
  const kesBase = cappedBase(monthlyBruto, b.kesehatan.cap)
  const jkkRate = b.jkk.classes[jkkRiskClass] ?? b.jkk.classes[1]

  const round = (x: number) => Math.round(x)

  return {
    jhtEmployer: round(monthlyBruto * b.jht.employer),
    jhtEmployee: round(monthlyBruto * b.jht.employee),
    jkk: round(monthlyBruto * jkkRate),
    jkm: round(monthlyBruto * b.jkm.employer),
    jpEmployer: round(jpBase * b.jp.employer),
    jpEmployee: round(jpBase * b.jp.employee),
    kesehatanEmployer: round(kesBase * b.kesehatan.employer),
    kesehatanEmployee: round(kesBase * b.kesehatan.employee),
  }
}

// ---------------------------------------------------------------------------
// Combined payroll line
// ---------------------------------------------------------------------------

export function computePayrollLine(input: TerEngineInput): TerEngineResult {
  const pph21Monthly = computePph21TerMonthly(input)
  const bpjs = computeBpjs(input.monthlyBruto, input.jkkRiskClass)

  const employeeSide =
    pph21Monthly +
    bpjs.jhtEmployee +
    bpjs.jpEmployee +
    bpjs.kesehatanEmployee

  return {
    pph21Monthly,
    appliedRate: monthlyBrutoRate(input),
    bracket: findTerBracket(input.monthlyBruto, input.ptkpStatus, input.category),
    bpjs,
    takeHomePayHint: Math.round(input.monthlyBruto - employeeSide),
  }
}

function monthlyBrutoRate(input: TerEngineInput): number {
  const bracket = findTerBracket(input.monthlyBruto, input.ptkpStatus, input.category)
  if (!bracket) return 0
  if (input.category === 'C') {
    const multiplier = data.ter.categoryC.multiplier ?? 1.2
    return Math.min(1, bracket.rate * multiplier)
  }
  return bracket.rate
}

// ---------------------------------------------------------------------------
// THR calculation (Permenaker 6/2016 + UU 13/2003 §157)
// ---------------------------------------------------------------------------

export interface ThrInput {
  monthsOfService: number // >= 0
  wageBasis: number // gaji pokok + tunjangan tetap (monthly)
}

/**
 * THR eligibility: >= 12 months → 1× wageBasis; 1..12 months → prorate
 * months/12; < 1 month → 0 (not entitled). Prorate rounds to rupiah.
 */
export function computeThr(input: ThrInput): number {
  const { monthsOfService, wageBasis } = input
  if (monthsOfService < 1 || wageBasis <= 0) return 0
  if (monthsOfService >= 12) return Math.round(wageBasis)
  return Math.round((monthsOfService / 12) * wageBasis)
}

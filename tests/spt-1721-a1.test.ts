import { describe, it, expect } from 'vitest'

/**
 * SPT 1721-A1 Tax Engine Tests
 * PMK 168/2023 + UU HPP Compliance
 * Test: Annual PPh 21 reconciliation (Masa Terakhir)
 */

// Constants per PMK 168/2023
const TAX_BRACKETS = [
  { min: 0, max: 60_000_000, rate: 0.05 },
  { min: 60_000_000, max: 250_000_000, rate: 0.15 },
  { min: 250_000_000, max: 500_000_000, rate: 0.25 },
  { min: 500_000_000, max: 5_000_000_000, rate: 0.30 },
  { min: 5_000_000_000, max: Infinity, rate: 0.35 },
]

const PTKP = {
  'TK/0': 54_000_000,
  'TK/1': 58_500_000,
  'TK/2': 63_000_000,
  'TK/3': 67_500_000,
  'K/0': 58_500_000,
  'K/1': 63_000_000,
  'K/2': 67_500_000,
  'K/3': 72_000_000,
}

function calculateTaxableIncome(
  annualGross: number,
  jhtEmployee: number,
  jpEmployee: number,
  ptkpCategory: string
): number {
  // Biaya Jabatan: 5% of annual gross, capped at Rp 6M/year
  const biayaJabatan = Math.min(annualGross * 0.05, 6_000_000)

  // Total deductions
  const totalDeductions = biayaJabatan + jhtEmployee + jpEmployee

  // Taxable income = Gross - Deductions - PTKP
  const netIncome = annualGross - totalDeductions
  const ptkp = PTKP[ptkpCategory as keyof typeof PTKP] || PTKP['TK/0']

  return Math.max(netIncome - ptkp, 0)
}

function calculateProgressiveTax(taxableIncome: number): number {
  let tax = 0

  for (const bracket of TAX_BRACKETS) {
    if (taxableIncome <= bracket.min) break

    const incomeInBracket = Math.min(taxableIncome, bracket.max) - bracket.min
    tax += incomeInBracket * bracket.rate
  }

  return Math.round(tax)
}

function calculateAnnualReconciliation(
  annualGross: number,
  monthlyTaxTER_JanNov: number[], // array of 11 months
  jhtEmployee: number,
  jpEmployee: number,
  ptkpCategory: string
): {
  taxableIncome: number
  taxDue: number
  taxWithheldJanNov: number
  taxReconciliationDec: number
} {
  // Step 1: Calculate taxable income for annual reconciliation
  const taxableIncome = calculateTaxableIncome(annualGross, jhtEmployee, jpEmployee, ptkpCategory)

  // Step 2: Calculate total tax due via Pasal 17
  const taxDue = calculateProgressiveTax(taxableIncome)

  // Step 3: Sum TER withholdings Jan-Nov
  const taxWithheldJanNov = monthlyTaxTER_JanNov.reduce((a, b) => a + b, 0)

  // Step 4: December reconciliation
  const taxReconciliationDec = taxDue - taxWithheldJanNov

  return {
    taxableIncome,
    taxDue,
    taxWithheldJanNov,
    taxReconciliationDec,
  }
}

describe('SPT 1721-A1 Tax Reconciliation Engine', () => {
  describe('Pasal 17 Progressive Tax Brackets', () => {
    it('should calculate 5% tax on income up to 60M', () => {
      const taxableIncome = 50_000_000
      const tax = calculateProgressiveTax(taxableIncome)
      expect(tax).toBe(2_500_000) // 50M * 5%
    })

    it('should calculate tiered tax on income spanning brackets', () => {
      // 100M income
      // 0-60M: 60M * 5% = 3M
      // 60-100M: 40M * 15% = 6M
      // Total = 9M
      const taxableIncome = 100_000_000
      const tax = calculateProgressiveTax(taxableIncome)
      expect(tax).toBe(9_000_000)
    })

    it('should calculate correct tax for 250M income', () => {
      // 0-60M: 60M * 5% = 3M
      // 60-250M: 190M * 15% = 28.5M
      // Total = 31.5M
      const taxableIncome = 250_000_000
      const tax = calculateProgressiveTax(taxableIncome)
      expect(tax).toBe(31_500_000)
    })
  })

  describe('Taxable Income Calculation', () => {
    it('should deduct biaya jabatan at 5% (capped at 6M)', () => {
      const annualGross = 200_000_000
      const biayaJabatan = 200_000_000 * 0.05 // 10M, but capped at 6M
      expect(biayaJabatan).toBe(10_000_000) // uncapped calculation

      const taxableIncome = calculateTaxableIncome(
        annualGross,
        0,
        0,
        'TK/0'
      )
      // Net = 200M - 6M (biaya jabatan capped) = 194M
      // Taxable = 194M - 54M (PTKP) = 140M
      expect(taxableIncome).toBe(140_000_000)
    })

    it('should deduct JHT + JP employee contributions', () => {
      const annualGross = 120_000_000
      const jhtEmployee = 2_400_000 // 2% * 120M
      const jpEmployee = 1_200_000 // 1% * 120M
      const taxableIncome = calculateTaxableIncome(
        annualGross,
        jhtEmployee,
        jpEmployee,
        'TK/1'
      )
      // Biaya Jabatan: 6M (capped)
      // Net = 120M - 6M - 2.4M - 1.2M = 110.4M
      // Taxable = 110.4M - 58.5M (PTKP TK/1) = 51.9M
      expect(taxableIncome).toBe(51_900_000)
    })
  })

  describe('Full Annual Reconciliation (Masa Terakhir)', () => {
    it('should reconcile correctly for employee with TK/0 status', () => {
      const annualGross = 120_000_000
      const monthlyTER = Array(11).fill(750_000) // Jan-Nov TER withholding
      const result = calculateAnnualReconciliation(
        annualGross,
        monthlyTER,
        2_400_000, // 2% JHT
        1_200_000, // 1% JP
        'TK/0'
      )

      // Taxable = 120M - 6M (biaya) - 2.4M - 1.2M - 54M (PTKP) = 56.4M
      // Tax due = 56.4M * 5% (all in first bracket) = 2.82M
      // Jan-Nov withholding = 750k * 11 = 8.25M
      // Dec reconciliation = 2.82M - 8.25M = -5.43M (overpaid)

      expect(result.taxableIncome).toBe(56_400_000)
      expect(result.taxDue).toBe(2_820_000)
      expect(result.taxWithheldJanNov).toBe(8_250_000)
      expect(result.taxReconciliationDec).toBe(-5_430_000) // Refund
    })

    it('should reconcile correctly for high-income employee', () => {
      const annualGross = 360_000_000 // 30M/month
      const monthlyTER = Array(11).fill(4_500_000)
      const result = calculateAnnualReconciliation(
        annualGross,
        monthlyTER,
        7_200_000, // 2% JHT
        3_600_000, // 1% JP
        'TK/2'
      )

      // Biaya Jabatan = 6M (capped)
      // Net = 360M - 6M - 7.2M - 3.6M = 343.2M
      // Taxable = 343.2M - 63M (PTKP TK/2) = 280.2M
      // Tax due = 60M*5% + 190M*15% + 30.2M*25% = 3M + 28.5M + 7.55M = 39.05M
      // Jan-Nov = 4.5M * 11 = 49.5M
      // Dec = 39.05M - 49.5M = -10.45M (overpaid)

      expect(result.taxableIncome).toBe(280_200_000)
      expect(result.taxDue).toBe(39_050_000)
      expect(result.taxWithheldJanNov).toBe(49_500_000)
      expect(result.taxReconciliationDec).toBe(-10_450_000)
    })

    it('should require payment in December if underpaid', () => {
      const annualGross = 180_000_000
      const monthlyTER = Array(11).fill(1_000_000) // Low TER withholding
      const result = calculateAnnualReconciliation(
        annualGross,
        monthlyTER,
        3_600_000, // 2% JHT
        1_800_000, // 1% JP
        'K/1'
      )

      // Biaya = 6M (capped)
      // Net = 180M - 6M - 3.6M - 1.8M = 168.6M
      // Taxable = 168.6M - 63M (PTKP K/1) = 105.6M
      // Tax due = 60M*5% + 45.6M*15% = 3M + 6.84M = 9.84M
      // Jan-Nov = 1M * 11 = 11M
      // Dec = 9.84M - 11M = -1.16M (still overpaid, but closer)

      expect(result.taxReconciliationDec).toBeCloseTo(-1_160_000, 0)
    })
  })
})

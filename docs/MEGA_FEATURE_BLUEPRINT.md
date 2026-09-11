# MEGA FEATURE BLUEPRINT: Arsitektur Flagship PPh 21 TER 2026 + BPJS + Pipeline Payslip APEX HR Platform Indonesia

> **Dokumen Arsitektur Sistem Flagship**  
> **Status:** Architecture Blueprint (Approved for Design)  
> **Target Platform:** APEX SaaS HR Indonesia (Next.js 16, Supabase Postgres, TypeScript)  
> **Versi:** 1.0.0 | **Tanggal:** September 2026  
> **Klasifikasi:** Confidential / Engineering Core Architecture  

---

## 1. Ringkasan Eksekutif & Visi Produk

**APEX** dikembangkan sebagai platform B2B SaaS HR & Operational Control untuk pasar Indonesia. Sebagai sistem kelas *Enterprise-Grade* dengan filosofi **"Zero-Burden Client"**, APEX menggabungkan absensi selfie terverifikasi (SHA-256 integrity + GPS high-accuracy), jadwal shift, manajemen tugas, inventaris SKU, kasbon karyawan (Earned Wage Access / EWA), hingga Tunjangan Hari Raya (THR).

Blueprint ini mendesain modul flagship payroll APEX: **Engine Pajak PPh 21 TER 2026, Komponen BPJS Ketenagakerjaan & Kesehatan, serta Pipeline Payslip Digital End-to-End**. Modul ini mengubah APEX dari *Payroll-Lite* menjadi **Platform HR Indonesia Lengkap** yang comply secara mutlak terhadap regulasi perpajakan dan ketenagakerjaan Indonesia.

### Prinsip Utama Arsitektur Payroll APEX:
1. **Strict Fail-Closed Engine**: Jika file parameter pajak/BPJS tidak ada, korup, atau tidak valid, engine **TIDAK BOLEH** menebak atau menggunakan angka karangan. Engine akan mengembalikan nilai pemotongan `0` disertai flag error eksplisit untuk menghentikan kalkulasi secara aman.
2. **Pemisahan Lapisan Murni (Pure Engine vs Adapter)**: Kalkulasi perpajakan dan BPJS berada di pustaka murni (*pure functions*) yang terisolasi dari database, berkinerja tinggi, dan 100% deterministik tanpa *side-effects*.
3. **Imutabilitas Run Payroll & Audit Trail**: Hasil kompilasi gaji bulanan dipatenkan (*locked snapshot*) dengan hash integritas SHA-256 untuk keperluan verifikasi audit dan pelaporan SPT 1721-A1.
4. **Kepatuhan Hukum Ketenagakerjaan & Data Pribadi**: Mengakomodasi ketentuan kewajiban Rincian Upah (PP No. 36/2021 & PP No. 51/2023) serta enkripsi identitas sensitif (NIK/NPWP) sesuai UU Perlindungan Data Pribadi (UU No. 27/2022).

---

## 2. Kerangka Regulasi & Hukum Payroll Indonesia 2026

Arsitektur payroll APEX dibangun berdasarkan kerangka hukum resmi Republik Indonesia:

```
+-----------------------------------------------------------------------------------+
|                            KERANGKA HUKUM PAYROLL INDONESIA                       |
+-----------------------------------------------------------------------------------+
|  PPh 21 TER 2026    | PP 58/2023 & PMK 168/2023 (TER Masa Jan-Nov)                |
|                     | UU HPP No. 7/2021 & Pasal 17 (Rekonsiliasi Masa Des/Terakhir)|
+---------------------+-------------------------------------------------------------+
|  BPJS TK & JKN      | UU SJSN No. 40/2004, PP 44/2015 (JKK/JKM), PP 46/2015 (JHT) |
|                     | PP 45/2015 (JP), Perpres 82/2018 (JKN/Kesehatan)            |
+---------------------+-------------------------------------------------------------+
|  Slip Gaji Digital  | UU Ketenagakerjaan No. 13/2003, PP 36/2021 & PP 51/2023     |
+---------------------+-------------------------------------------------------------+
|  Perlindungan Data  | UU Perlindungan Data Pribadi (UU No. 27/2022 - UU PDP)      |
+-----------------------------------------------------------------------------------+
```

### 2.1 PPh 21 TER (Tarif Efektif Rata-rata) 2026
Sesuai **PP 58/2023** dan **PMK 168/2023**, perhitungan PPh 21 bagi Pegawai Tetap dibagi menjadi 2 fase utama:
1. **Masa Pajak Bulan Januari s.d. November (Masa Non-Terakhir)**:
   Perhitungan PPh 21 tidak menggunakan skema pengurangan Biaya Jabatan & PTKP secara bulanan berlapis, melainkan mengalikan **Penghasilan Bruto Bulanan** dengan **Tarif Efektif Rata-rata (TER)** sesuai kategori PTKP.
   - **Kategori A**: PTKP TK/0 (Rp 54 jt), TK/1 (Rp 58.5 jt), K/0 (Rp 58.5 jt) — *44 Lapisan Tarif (0% s.d. 34%)*
   - **Kategori B**: PTKP TK/2 (Rp 63 jt), TK/3 (Rp 67.5 jt), K/1 (Rp 63 jt), K/2 (Rp 67.5 jt) — *40 Lapisan Tarif (0% s.d. 34%)*
   - **Kategori C**: PTKP K/3 (Rp 72 jt) — *41 Lapisan Tarif (0% s.d. 34%)*
2. **Masa Pajak Bulan Desember / Masa Terakhir**:
   Rekonsiliasi tahunan menggunakan rumus Tarif Progresif **Pasal 17 UU PPh / UU HPP** atas akumulasi Neto setahun (Bruto Setahun - Biaya Jabatan [maks Rp 6.000.000/thn atau Rp 500.000/bln] - Iuran Pensiun/JHT yang dibayar pegawai - PTKP), dikurangi total PPh 21 TER yang telah dipotong pada Masa Jan–Nov.

> **Catatan Penting Penalti Non-NPWP**: Sesuai PMK 168/2023, kategori TER didasarkan pada status PTKP. Tarif TER bulanan Pegawai Tetap tidak mengalami penalti 20% tambahan bulanan. Penalti non-NPWP direkonsiliasi pada perhitungan akhir tahun (Pasal 17) atau saat diterbitkannya bukti potong.

### 2.2 Komponen Iuran BPJS Ketenagakerjaan & Kesehatan (Posisi 2026)
Terdapat 5 program utama jaminan sosial yang wajib dihitung dalam payroll APEX:

| Program BPJS | Beban Perusahaan (Employer) | Beban Karyawan (Employee) | Batas Atas Gaji (Cap Ceiling) | Dasar Hukum |
| :--- | :---: | :---: | :---: | :--- |
| **JHT** (Hari Tua) | **3,70%** | **2,00%** | Tidak ada Cap (*Full Wage*) | PP 46/2015 |
| **JKK** (Kecelakaan Kerja) | **0,24% – 1,74%** | **0,00%** | Tidak ada Cap (*Full Wage*) | PP 44/2015 |
| **JKM** (Kematian) | **0,30%** | **0,00%** | Tidak ada Cap (*Full Wage*) | PP 44/2015 |
| **JP** (Pensiun) | **2,00%** | **1,00%** | **Rp 11.086.300 / bulan** (Revisi Mar 2026) | PP 45/2015 |
| **JKN** (Kesehatan) | **4,00%** | **1,00%** | **Rp 12.000.000 / bulan** | Perpres 82/2018 |

#### Klasifikasi Risiko JKK:
- **Tingkat Risiko Sangat Rendah (Kelompok I)**: 0,24% (Perkantoran/Jasa)
- **Tingkat Risiko Rendah (Kelompok II)**: 0,54% (Ritel/Pendidikan/Klinik - *Default APEX*)
- **Tingkat Risiko Sedang (Kelompok III)**: 0,89% (F&B/Manufaktur Ringan)
- **Tingkat Risiko Tinggi (Kelompok IV)**: 1,27% (Konstruksi/Logistik Berat)
- **Tingkat Risiko Sangat Tinggi (Kelompok V)**: 1,74% (Pertambangan/Pekerjaan Ekstrem)

### 2.3 Kewajiban Slip Gaji Digital (PP No. 36/2021 & PP No. 51/2023)
Sesuai **Pasal 53 PP No. 36/2021 tentang Pengupahan**, pengusaha wajib memberikan **bukti pembayaran upah (slip gaji)** yang memuat rincian upah yang diterima pekerja pada saat upah dibayarkan. Slip gaji wajib memuat:
1. Identitas Perusahaan dan Karyawan (Nama, NIK/ID, Jabatan, Status PTKP/NPWP).
2. Periode Pembayaran Upah & Rekap Kehadiran Terverifikasi.
3. Rincian Pendapatan (*Earnings*): Gaji Pokok, Upah Lembur, Tunjangan Tetap, Tunjangan Tidak Tetap/THR.
4. Rincian Potongan (*Deductions*): PPh 21 TER, BPJS Ketenagakerjaan (JHT + JP), BPJS Kesehatan, Potongan Kasbon/EWA.
5. Total Gaji Bersih Diterima (*Net Take-Home Pay*).
6. Tanda Tangan Digital / QR Verification Code & Disclaimer Keabsahan Dokumen.

---

## 3. Diagram Alir Data Sistem (ASCII Data Flow)

Berikut adalah arsitektur pipeline data end-to-end dari sumber data absensi hingga penerbitan slip gaji digital:

```
+--------------------------------------------------------------------------------------------------+
|                                  APEX PAYROLL DATA PIPELINE                                      |
+--------------------------------------------------------------------------------------------------+

  [Attendance Logs]        [Shift Assignments]        [Employee Settings]         [Kasbon Module]
  - Clock-In/Out (GPS)     - Template Shift           - Base Salary              - Active Installments
  - SHA-256 Hash           - Overnight Flag           - Overtime Hourly Rate     - Schedule Matrix
  - Timestamps             - Workday Matrix           - PTKP / JKK / BPJS Caps   - Repayment Ledger
           |                        |                          |                          |
           +-----------+------------+                          |                          |
                       |                                       |                          |
                       v                                       v                          |
        +----------------------------+                         |                          |
        |  Attendance Recap Engine   |                         |                          |
        |  (src/lib/attendance.ts)   |                         |                          |
        | - Total Days Present       |                         |                          |
        | - Late Minutes / Count     |                         |                          |
        | - Verified Overtime Hours  |                         |                          |
        +----------------------------+                         |                          |
                       |                                       |                          |
                       +-------------------+-------------------+                          |
                                           |                                              |
                                           v                                              |
                       +---------------------------------------+                          |
                       |     Payroll Gross Earnings Engine     |                          |
                       |      - Base Salary                    |                          |
                       |      - Overtime Pay (Hours x Rate)    |                          |
                       |      - Fixed Allowances / THR         |                          |
                       |      = Total Monthly Bruto            |                          |
                       +---------------------------------------+                          |
                                           |                                              |
                                           v                                              |
                       +---------------------------------------+                          |
                       |      BPJS Contribution Engine         |                          |
                       | - JHT (3.7% / 2%) - Uncapped          |                          |
                       | - JKK (0.24%-1.74%) / JKM (0.3%)       |                          |
                       | - JP (2% / 1%) - Cap Rp 11.086.300    |                          |
                       | - JKN (4% / 1%) - Cap Rp 12.000.000   |                          |
                       +---------------------------------------+                          |
                                           |                                              |
                                           v                                              |
                       +---------------------------------------+                          |
                       |    Fail-Closed PPh 21 TER Engine      |                          |
                       | - Params Validator (ter-2026.json)     |                          |
                       | - PTKP Category Derivation (A/B/C)    |                          |
                       | - Bracket Binary Lookup               |                          |
                       | - Monthly TER Withholding Calc        |                          |
                       +---------------------------------------+                          |
                                           |                                              |
                                           v                                              v
                       +------------------------------------------------------------------+
                       |                    Kasbon Deduction Integrator                   |
                       | - Lock & Fetch Due Repayments for Current Month                  |
                       | - Validate Repayment Integrity vs Approved Loan Cap              |
                       +------------------------------------------------------------------+
                                           |
                                           v
                       +------------------------------------------------------------------+
                       |                   Net Take-Home Pay Computer                     |
                       |   TakeHomePay = Bruto - PPh21 - Employee_BPJS - Kasbon_Deduction  |
                       +------------------------------------------------------------------+
                                           |
                                           v
       +----------------------------------------------------------------------------------+
       |                           Auditable Ledger & Locking Layer                       |
       | - Save Snapshot to `payroll_runs` & `payroll_run_items`                           |
       | - Generate Immutable SHA-256 Audit Signature                                     |
       | - Mark Kasbon Repayment Status as Paid (`paid_at = NOW()`)                       |
       +----------------------------------------------------------------------------------+
                                           |
                                           v
       +----------------------------------------------------------------------------------+
       |                        Presentation & Slip Generation Layer                      |
       | - Interactive Dashboard (PayrollClient.tsx)                                      |
       | - CSV Export Engine (UTF-8 BOM + Semicolon Delimiter)                            |
       | - Digital Slip View & PDF Printer (PayslipPage.tsx)                              |
       +----------------------------------------------------------------------------------+
```

---

## 4. Batasan Modul & Arsitektur Perangkat Lunak

Arsitektur APEX menerapkan **Pemisahan Tanggung Jawab Secara Ketat (*Strict Separation of Concerns*)** antara Pustaka Kalkulasi Murni (*Pure Engine Core*) dengan Adaptor Database/UI.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
|                                     APEX APPLICATION                                   |
├────────────────────────────────────────────────────────────────────────────────────────┤
| [UI Layer]            app/[slug]/payroll/page.tsx, PayrollClient.tsx, slip/page.tsx   |
├────────────────────────────────────────────────────────────────────────────────────────┤
| [Server Actions]      payroll-actions.ts, kasbon-actions.ts (Authz & Audit Logging)    |
├────────────────────────────────────────────────────────────────────────────────────────┤
| [DB Adapters]         payroll-db.ts (Supabase Queries, RLS, Data Normalization)       |
├────────────────────────────────────────────────────────────────────────────────────────┤
| [Pure Engine Libs]    ★ src/lib/ter-engine.ts (Pure Functions, Zero DB, 100% Deterministic)|
|                       ★ src/lib/payroll.ts (Payroll Line Integrator)                  |
|                       ★ src/lib/attendance-recap.ts (Recap Aggregator)               |
├────────────────────────────────────────────────────────────────────────────────────────┤
| [Data Store]          src/data/ter-2026.json (Verified Statutory Parameters & Brackets)|
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Pure Engine Lib (`src/lib/ter-engine.ts`)
- **Peran**: Melakukan kalkulasi matematika murni untuk PPh 21 TER, BPJS Ketenagakerjaan, BPJS Kesehatan, dan THR.
- **Karakteristik**:
  - **Zero Side-Effects**: Tidak melakukan fetch HTTP, tidak mengakses filesystem, tidak memanggil Supabase client.
  - **Deterministic**: Input yang sama selalu menghasilkan output yang identik.
  - **Fail-Closed**: Jika tabel tarif tidak valid, melemparkan error terstruktur atau mengembalikan `0` withholding dengan `hasError: true`.

### 4.2 Adapter & Server Actions (`src/lib/payroll-actions.ts` & DB Layer)
- **Peran**: Menangani otentikasi/otorisasi (memeriksa *role* Admin/Manager dan entitlement paket Pro), mengambil data dari Supabase, memanggil *Pure Engine*, menyimpan hasil *payroll run*, serta mencatat *audit log*.
- **Karakteristik**:
  - Berjalan sepenuhnya di Server Side (Next.js Server Actions / React Server Components).
  - Melindungi data karyawan melalui Supabase RLS (*Row Level Security*).

---

## 5. Skema Tabel Tambahan & DDL Draft (Supabase Postgres)

Untuk mendukung snapshot payroll historis, audit trail, serta integrasi PPh 21 TER dan BPJS secara penuh, berikut adalah rancangan skema basis data tambahan:

```sql
-- Migration: 20260911000011_payroll_ter_bpjs_flagship.sql

-- 1. Ekstensi tabel employee_payroll_settings untuk parameter pajak & BPJS
ALTER TABLE public.employee_payroll_settings
    ADD COLUMN IF NOT EXISTS ptkp_status VARCHAR(5) NOT NULL DEFAULT 'TK/0'
        CHECK (ptkp_status IN ('TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3')),
    ADD COLUMN IF NOT EXISTS npwp_number VARCHAR(20) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS jkk_risk_class SMALLINT NOT NULL DEFAULT 1 
        CHECK (jkk_risk_class BETWEEN 0 AND 4),
    ADD COLUMN IF NOT EXISTS bpjs_tk_number VARCHAR(30) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS bpjs_kes_number VARCHAR(30) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS fixed_allowance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (fixed_allowance >= 0);

-- 2. Tabel Header Payroll Run Bulanan (Lock & Audit Trail)
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payroll_month VARCHAR(7) NOT NULL CHECK (payroll_month ~ '^[0-9]{4}-[0-9]{2}$'),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'disbursed', 'cancelled')),
    total_employees INTEGER NOT NULL DEFAULT 0,
    total_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_pph21 NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_bpjs_employer NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_bpjs_employee NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_kasbon_deduction NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_netto NUMERIC(14,2) NOT NULL DEFAULT 0,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    integrity_hash VARCHAR(64) DEFAULT NULL, -- SHA-256 hash snapshot
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, payroll_month)
);

-- 3. Tabel Detail Item Payroll Per Karyawan (Immutable Snapshot)
CREATE TABLE IF NOT EXISTS public.payroll_run_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ptkp_status VARCHAR(5) NOT NULL,
    ter_category CHAR(1) NOT NULL CHECK (ter_category IN ('A', 'B', 'C')),
    ter_rate NUMERIC(6,4) NOT NULL DEFAULT 0, -- e.g. 0.0250 = 2.5%
    days_present INTEGER NOT NULL DEFAULT 0,
    ot_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
    base_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
    fixed_allowance NUMERIC(14,2) NOT NULL DEFAULT 0,
    ot_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
    gross_salary NUMERIC(14,2) NOT NULL DEFAULT 0, -- Bruto
    
    -- BPJS Breakdown Employer
    bpjs_jht_employer NUMERIC(14,2) NOT NULL DEFAULT 0,
    bpjs_jkk NUMERIC(14,2) NOT NULL DEFAULT 0,
    bpjs_jkm NUMERIC(14,2) NOT NULL DEFAULT 0,
    bpjs_jp_employer NUMERIC(14,2) NOT NULL DEFAULT 0,
    bpjs_kes_employer NUMERIC(14,2) NOT NULL DEFAULT 0,
    
    -- BPJS Breakdown Employee (Deductions)
    bpjs_jht_employee NUMERIC(14,2) NOT NULL DEFAULT 0,
    bpjs_jp_employee NUMERIC(14,2) NOT NULL DEFAULT 0,
    bpjs_kes_employee NUMERIC(14,2) NOT NULL DEFAULT 0,
    
    -- Tax & Kasbon Deductions
    pph21_monthly NUMERIC(14,2) NOT NULL DEFAULT 0,
    kasbon_deduction NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(14,2) NOT NULL DEFAULT 0,
    
    -- Final Net Salary
    take_home_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(payroll_run_id, user_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_run_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY select_payroll_runs ON public.payroll_runs
    FOR SELECT USING (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    );

CREATE POLICY manage_payroll_runs ON public.payroll_runs
    FOR ALL USING (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    );

CREATE POLICY select_payroll_run_items ON public.payroll_run_items
    FOR SELECT USING (
        company_id = public.get_company_id() AND (
            user_id = public.get_user_id() OR
            public.get_user_role() IN ('Admin', 'Manager')
        )
    );

CREATE POLICY manage_payroll_run_items ON public.payroll_run_items
    FOR ALL USING (
        company_id = public.get_company_id() AND
        public.get_user_role() IN ('Admin', 'Manager')
    );

-- 6. Trigger Invarian Keuangan: Menjamin Total Deductions = PPh21 + BPJS_Employee + Kasbon
CREATE OR REPLACE FUNCTION public.enforce_payroll_item_math_integrity()
RETURNS TRIGGER AS $$
DECLARE
    calc_deductions NUMERIC(14,2);
    calc_netto NUMERIC(14,2);
BEGIN
    calc_deductions := NEW.pph21_monthly + NEW.bpjs_jht_employee + NEW.bpjs_jp_employee + NEW.bpjs_kes_employee + NEW.kasbon_deduction;
    calc_netto := NEW.gross_salary - calc_deductions;

    IF ABS(NEW.total_deductions - calc_deductions) > 1 THEN
        RAISE EXCEPTION 'Integritas matematika payroll gagal: total_deductions tidak cocok dengan penjumlahan potongan.';
    END IF;

    IF ABS(NEW.take_home_pay - calc_netto) > 1 THEN
        RAISE EXCEPTION 'Integritas matematika payroll gagal: take_home_pay tidak cocok dengan (bruto - total_deductions).';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_payroll_item_math_integrity
  BEFORE INSERT OR UPDATE ON public.payroll_run_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payroll_item_math_integrity();
```

---

## 6. Strategi Fail-Closed & Validasi Struktur Parameter

Sistem payroll APEX menerapkan prinsip **Fail-Closed Security & Financial Safety**. Engine tidak boleh memutar angka spekulatif apabila data statutory mengalami kegagalan muat.

```typescript
// Core Validation Rules dalam ter-engine.ts & JSON Schema Validator

export interface TerDataSchema {
  _meta: {
    generatedFrom: string
    categoryMapping: Record<PtkpStatus, TerCategory>
    asOf: string
  }
  ter: {
    byStatus: Record<PtkpStatus, TerBracket[]>
    boundaryConvention: string
  }
  ptkp: Record<PtkpStatus, number>
  bpjs: BpjsConfig
}

/**
 * Validasi Struktur Parameter TER & BPJS pada saat runtime startup.
 * Memastikan tabel terisi 8 status PTKP, bracket berlanjut tanpa celah/tumpang tindih,
 * dan tarif berada dalam rentang valid 0% - 34%.
 */
export function validateTerParams(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['File parameter ter-2026.json kosong atau bukan objek JSON.'] }
  }

  const d = data as Partial<TerDataSchema>
  const requiredStatuses: PtkpStatus[] = ['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']

  if (!d.ter?.byStatus) {
    errors.push('Struktur ter.byStatus tidak ditemukan.')
    return { valid: false, errors }
  }

  for (const status of requiredStatuses) {
    const brackets = d.ter.byStatus[status]
    if (!Array.isArray(brackets) || brackets.length === 0) {
      errors.push(`Tabel TER untuk status PTKP '${status}' tidak ditemukan atau kosong.`)
      continue
    }

    let prevMax = 0
    for (let i = 0; i < brackets.length; i++) {
      const b = brackets[i]
      if (typeof b.min !== 'number' || b.min < 0) {
        errors.push(`Status ${status} baris ${i}: min harus berupa angka >= 0.`)
      }
      if (b.min < prevMax) {
        errors.push(`Status ${status} baris ${i}: terjadi tumpang tindih rentang min (${b.min}) vs prevMax (${prevMax}).`)
      }
      if (typeof b.rate !== 'number' || b.rate < 0 || b.rate > 0.34) {
        errors.push(`Status ${status} baris ${i}: tarif ${b.rate} di luar batas legal (0 s.d. 0.34).`)
      }
      if (i > 0 && b.rate < brackets[i - 1].rate) {
        errors.push(`Status ${status} baris ${i}: terjadi penurunan tarif progresif (${b.rate} < ${brackets[i - 1].rate}).`)
      }
      prevMax = b.max ?? Number.MAX_SAFE_INTEGER
    }

    const lastBracket = brackets[brackets.length - 1]
    if (lastBracket.max !== null || lastBracket.rate !== 0.34) {
      errors.push(`Status ${status}: baris terakhir harus tidak terbatas (max: null) dengan tarif 34%.`)
    }
  }

  return { valid: errors.length === 0, errors }
}
```

### Aturan Fail-Closed saat Terjadi Invalid Data:
1. Jika `validateTerParams()` mengembalikan `valid: false`, `computePph21TerMonthly()` **TIDAK BISA** dijalankan.
2. Engine mengembalikan nilai potongan pajak `pph21Monthly = 0`, `appliedRate = 0`, serta menandai properti `hasError: true` dan `errorMessage: "Statutory parameters invalid: fail-closed engaged"`.
3. UI memperlihatkan *Warning Badge* berwarna merah pada halaman admin: `"Kalkulasi Pajak Diberhentikan: Data Tabel TER Tidak Valid"`.

---

## 7. Pipeline Payslip End-to-End & Audit Trail

### 7.1 Alur Kalkulasi Gaji & Pemotongan Kasbon
1. **Fetch & Rekap Presensi**:
   Sistem menarik data log presensi dan shift pada periode bulan berjalan (`YYYY-MM`) untuk menghitung total hari hadir, keterlambatan, dan jumlah jam lembur terverifikasi.
2. **Kalkulasi Upah Lembur**:
   - Berdasarkan `overtime_rate_per_hour` karyawan.
   - Upah Lembur = `Math.round(otHours * otRatePerHour)`.
3. **Kalkulasi Total Bruto Bulanan**:
   - `monthlyBruto = baseSalary + fixedAllowance + otPay + premTHR`.
4. **Kalkulasi BPJS & PPh 21 TER**:
   - Diproses melalui `computePayrollLine({ monthlyBruto, ptkpStatus, jkkRiskClass })`.
5. **Kalkulasi Pemotongan Kasbon (EWA)**:
   - Sistem memeriksa tabel `kasbon_repayments` untuk `user_id` pada periode `payroll_month` terkait.
   - Jika terdapat cicilan aktif dengan status belum dibayar (`paid_at IS NULL`), jumlah cicilan `amount` dipotong langsung dari gaji bulanan.
6. **Kalkulasi Net Take-Home Pay (THP)**:
   - `takeHomePay = monthlyBruto - (pph21Monthly + bpjs.jhtEmployee + bpjs.jpEmployee + bpjs.kesehatanEmployee + kasbonDeduction)`.
7. **Penyimpanan Snapshot & Audit Trail (Penguncian Payroll)**:
   - Saat Admin menekan tombol **"Approve & Finalize Payroll"**, data disimpan ke tabel `payroll_runs` dan `payroll_run_items`.
   - Dihasilkan signature hash SHA-256:  
     `integrity_hash = SHA256(company_id + payroll_month + total_bruto + total_netto + approved_at)`.
   - Status cicilan kasbon diperbarui menjadi `paid_at = NOW()`, dan apabila seluruh cicilan lunas, status `kasbon_requests` berubah otomatis menjadi `fully_repaid`.

### 7.2 Format Slip Gaji Digital & QR Verifikasi
Slip Gaji Digital APEX dirancang *print-friendly* (A4 / Mobile-optimized) dengan layout resmi:

```
+-----------------------------------------------------------------------------------+
| APEX HR PLATFORM                                      SLIP GAJI KARYAWAN          |
| PT. COMPANY NAME HERE                                 Periode: September 2026     |
| SYSTEM ID: COMP-SLUG // OFFICIAL SLIP                 Status: VERIFIED            |
+-----------------------------------------------------------------------------------+
| Nama Karyawan : Ahmad Dahlan                  Jabatan       : Staff Senior        |
| ID Karyawan   : EMP-0042                      Status PTKP   : K/1 (TER Kat B)     |
| NPWP          : 12.345.678.9-012.000          Hari Hadir    : 22 Hari             |
+-----------------------------------------------------------------------------------+
| RINCIAN PENDAPATAN (EARNINGS)                 | RINCIAN POTONGAN (DEDUCTIONS)     |
+-----------------------------------------------+-----------------------------------+
| Gaji Pokok Bulanan      : Rp  8.000.000       | PPh 21 TER (1,50%)  : Rp   126.000|
| Tunjangan Tetap         : Rp  1.000.000       | BPJS JHT (2,00%)    : Rp   180.000|
| Upah Lembur (6,0 Jam)   : Rp    400.000       | BPJS JP (1,00%)     : Rp    90.000|
|                                               | BPJS Kesehatan (1%) : Rp    90.000|
|                                               | Cicilan Kasbon #2   : Rp   500.000|
+-----------------------------------------------+-----------------------------------+
| TOTAL BRUTO             : Rp  9.400.000       | TOTAL POTONGAN      : Rp   886.000|
+-----------------------------------------------+-----------------------------------+
| GAJI BERSIH DITERIMA (NET TAKE-HOME PAY)      : Rp  8.514.000                     |
| Terbilang: Delapan Juta Lima Ratus Empat Belas Ribu Rupiah                        |
+-----------------------------------------------------------------------------------+
|  [QR CODE VERIFIKASI]                         Disetujui Oleh (HR/Keuangan):       |
|  Hash: a3f8c...90e1                                                               |
|  Cetak Resmi: 28/09/2026                      ( PT. COMPANY NAME HERE )           |
+-----------------------------------------------------------------------------------+
```

---

## 8. Strategi Pengujian (Test Strategy & Invariants)

Sistem pengujian payroll APEX dibagi menjadi dua tingkat utama (*Two-Tiered Testing Strategy*):

```
+-----------------------------------------------------------------------------------+
|                             TWO-TIERED PAYROLL TEST SUITE                         |
+-----------------------------------------------------------------------------------+
|  TIER 1: Invariant & Structural Tests (Bebas Data / Data-Independent)             |
|  - Kelengkapan 8 Status PTKP (TK/0 s.d. K/3)                                      |
|  - Integritas Batas Bracket (min inclusive, max exclusive)                        |
|  - Monotonitas Tarif (Tarif tidak pernah turun pada bruto yang lebih tinggi)      |
|  - Batas Atas Maksimal Tarif (Top bracket 34% unbounded)                          |
|  - Presisi Matematika BPJS & Caps (JP Cap Rp 11,086,300 & JKN Cap Rp 12,000,000)  |
|  - Pengujian Prorata THR (Permenaker 6/2016)                                      |
+-----------------------------------------------------------------------------------+
|  TIER 2: Golden Tests (Verifikasi Contoh Kasus Resmi DJP PMK 168/2023)            |
|  - Tuan C (TK/0, Bruto Rp 15.500.000) -> Kategori A, TER 7% -> PPh21 = Rp 1.085.000|
|  - Tuan D (TK/0, Bruto Rp 17.500.000) -> Kategori A, TER 8% -> PPh21 = Rp 1.400.000|
|  - Tuan H (K/2,  Bruto Rp  6.800.000) -> Kategori B, TER 0,5%-> PPh21 = Rp   34.000|
|  - Boundary Edge: Bruto Rp 5.400.000 (TER 0%) vs Rp 5.400.001 (TER 0,25%)         |
+-----------------------------------------------------------------------------------+
```

### Eksekusi Unit Test Murni via Runner Node.js:
Pengujian dijalankan langsung melalui skrip test murni `node --test tests/ter-engine.test.mjs` yang memverifikasi pustaka engine secara cepat dan tanpa perlu meluncurkan bundler Next.js.

---

## 9. Rencana Peluncuran Bertahap (Phased Rollout Plan)

Implementasi arsitektur flagship payroll dibagi menjadi 3 fase utama untuk memastikan stabilitas dan nol gangguan pada data produksi:

```
+-----------------------------------------------------------------------------------+
|                            PHASED ROLLOUT ROADMAP                                 |
+-----------------------------------------------------------------------------------+
| FASE 1: Pure Engine Core & Hardening Pengujian (Minggu 1 - 2)                     |
|  - Finalisasi `src/lib/ter-engine.ts` & data `src/data/ter-2026.json`.             |
|  - Eksekusi 100% Golden Tests & Structural Invariants Test Suite.                 |
|  - Validasi runtime schema loader (Fail-closed validation gate).                  |
+-----------------------------------------------------------------------------------+
| FASE 2: Integrasi Schema DB & Rekap Presensi / Kasbon (Minggu 3 - 4)              |
|  - Eksekusi Migrasi DDL: `employee_payroll_settings` & `payroll_runs`.             |
|  - Pembaharuan Server Actions `saveBulkPayrollSettingsAction` dengan PTKP/BPJS.    |
|  - Integrasi pemotongan otomatis cicilan Kasbon (`kasbon_repayments`).            |
+-----------------------------------------------------------------------------------+
| FASE 3: UI Dashboard Flagship, Slip PDF & Ekspor Audit (Minggu 5 - 6)             |
|  - Upgrade UI `PayrollClient.tsx`: Tab Kompilasi TER, BPJS Breakdown, Kasbon.    |
|  - Implementasi halaman Slip Gaji Digital (`slip/[userId]/page.tsx`) + QR Hash.   |
|  - Ekspor CSV Komprehensif (Format Excel IDR, UTF-8 BOM, Delimiter Semicolon).    |
+-----------------------------------------------------------------------------------+
```

---

## 10. Manajemen Risiko Hukum, Data & Kepatuhan

| Kategori Risiko | Identifikasi Potensi Risiko | Implikasi Bisnis | Strategi Mitigasi Arsitektural APEX |
| :--- | :--- | :--- | :--- |
| **Kepatuhan Pajak (DJP)** | Perubahan tabel tarif TER atau batas PTKP oleh Kementerian Keuangan di pertengahan tahun. | Sengketa pemotongan pajak karyawan; denda administratif. | **Parametric Table Decoupling**: Tabel TER disimpan dalam file JSON eksternal (`ter-2026.json`) yang dapat diperbarui tanpa melakukan refactoring kode engine. |
| **Perlindungan Data (UU PDP)** | Kebocoran nomor NIK / NPWP / Besaran Gaji karyawan. | Denda pidana & sanksi administrasi hingga Rp 60 Miliar (UU No. 27/2022). | **Encrypted Data & RLS Isolation**: Akses RLS Postgres membatasi karyawan hanya dapat melihat slip miliknya sendiri; kolom sensitif diakses via TLS & HttpOnly Session. |
| **Audit Dispute Gaji** | Karyawan menyanggah jumlah upah lembur atau cicilan kasbon yang dipotong. | Penurunan kepercayaan internal; konflik ketenagakerjaan. | **Immutable Run Snapshot**: Setiap finalisasi payroll mengunci data pada `payroll_run_items` dan menandai hash SHA-256 untuk bukti audit yang tak dapat dimanipulasi (*anti-tamper*). |
| **Kasbon Double Deduction** | Potongan cicilan kasbon terduplikasi saat admin melakukan regenerasi payroll. | Kerugian finansial karyawan; ketidakseimbangan neraca. | **DB Invariant Trigger**: Skema Postgres menyertakan trigger `enforce_kasbon_repayment_integrity` yang memvalidasi total cicilan tidak boleh melebihi plafon kasbon. |

---

## 11. Kesimpulan

Dengan mengimplementasikan arsitektur ini, APEX meningkatkan kapabilitas produk dari sekadar pencatat presensi menjadi **Platform HR & Payroll SaaS Flagship Indonesia**. Sistem kalkulasi PPh 21 TER 2026 yang *fail-closed*, kalkulasi BPJS presisi, integrasi cicilan kasbon otomatis, dan slip gaji digital berintegritas tinggi memberikan kepastian hukum, kenyamanan operasional, dan efisiensi penuh bagi perusahaan pengguna di Indonesia.

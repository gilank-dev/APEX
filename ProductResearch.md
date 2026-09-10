# APEX — Product & Research Strategy Report: Indonesian HR SaaS

> **Author**: Strategic Product & Engineering Research  
> **Prepared for**: Gilank (Founder, APEX / Lankdev)  
> **Target Market**: Indonesian SMBs & Mid-Market Enterprises (20–150 employees)  
> **Operating URL**: `apex.lankdev.my.id`  
> **Document Status**: Production Ready | Confidential  
> **Date**: September 2026  

---

## Executive Summary

APEX is positioned to disrupt the Indonesian Human Resource Information System (HRIS) landscape by bridging the void between **overpriced enterprise suites** (such as Mekari Talenta) and **rudimentary attendance-only apps** (such as Kerjoo). While competitors charge a regressive per-employee toll (ranging from Rp 15,000 to Rp 85,000/employee/month) that penalizes growing businesses, APEX offers an operational operating system combining **geo-locked selfie attendance, shift rosters, SKU inventory, and task Kanban** at a flat, transparent rate.

However, to capture mainstream Indonesian SMEs—specifically multi-outlet retail, food & beverage (F&B), clinics, logistics, and light manufacturing—APEX must bridge three critical market gaps:
1. **Statutory Indonesian Compliance**: PPh 21 (TER 2024–2026 rules), BPJS Ketenagakerjaan & Kesehatan, and statutory overtime (*lembur*).
2. **Key Financial Retention Features**: **THR (Tunjangan Hari Raya)** computation engine and **Kasbon (Earned Wage Access / EWA)** liquidity.
3. **Indonesian-First Localized UX**: Frictionless WhatsApp-first onboarding, OTP authentication, and a dynamic pricing calculator demonstrating clear cost arbitrage against legacy players.

This document delivers the comprehensive product-market fit analysis, complete technical architecture specifications, Indonesian-first UX design, and a prioritized high-impact/low-effort implementation roadmap.

---

## 1. Product-Market Fit & Feature Gaps vs. Indonesian HR SaaS Competitors

### 1.1 Competitor Landscape Breakdown

To position APEX effectively, we analyze the three primary competitors defining the Indonesian HR SaaS market in 2026:

```
                            [ENTERPRISE COMPLEXITY]
                                      ▲
                                      │
                                      │       ● Mekari Talenta
                                      │       (Full HRIS + Ecosystem, High Cost)
                                      │
                                      │   ● Gadjian + Hadirr
                                      │   (Payroll-first, Dual-app model)
                                      │
                                      │   ★ APEX (Target PMF)
                                      │   (Unified Operations + Flat Price)
                                      │
                                      │   ● Kerjoo
                                      │   (Simple Mobile Attendance, Low Feature)
                                      │
  ────────────────────────────────────┼──────────────────────────────────────►
  [LOW COST / SIMPLE]                 │               [HIGH OPERATIONAL DEPTH]
                                      │
```

#### 1. Mekari Talenta
* **Market Position**: Undisputed market leader for Indonesian mid-market and enterprise corporations (100–5,000+ employees).
* **Pricing Model**: Opaque, tiered per-employee model starting at **Rp 25,000 to Rp 100,000/employee/month**, plus compulsory annual implementation fees (Rp 5,000,000 to Rp 25,000,000) and strict minimum seat contracts (minimum 30–50 seats).
* **Core Strengths**:
  * Deep regulatory compliance: Fully automated PPh 21 under PMK 168/2023 & PP 58/2023 (TER Categories A, B, C), Coretax integration ready, full BPJS calculation (JKK, JKM, JHT, JP, Kesehatan).
  * Mekari ecosystem synergy: Seamless lock-in with *Mekari Jurnal* (ERP/Accounting), *Mekari KlikPajak* (e-Filing/e-Billing), and *Mekari Flex* (EWA & employee benefits).
  * Complex enterprise workflows: Multi-tier approval matrices, custom delegation rules, and ISO 27001 compliance.
* **Vulnerabilities & Customer Frustrations**:
  * Prohibitive price point for businesses with 20–80 employees.
  * Over-engineered, bloated interface with significant training overhead.
  * Slow customer support via ticketing; SME accounts report feeling deprioritized.
  * Mobile application is notoriously heavy, sluggish on lower-end Android hardware, and prone to GPS drift errors.

#### 2. Gadjian (by Fast-8)
* **Market Position**: The payroll-specialist pioneer targeting Indonesian SMEs and growing service companies (30–300 employees).
* **Pricing Model**: Per-employee subscription at **Rp 18,000 to Rp 25,000/employee/month** with tiered package minimums (Standard vs. Pro).
* **Core Strengths**:
  * Precision payroll engine: Exceptional handling of complex Indonesian payroll quirks (shift allowances, late fines, gross vs. net vs. gross-up tax schemes).
  * Integrated EWA via *Payuung*: Enables employees to take salary advances without balance sheet liability for the employer.
  * *Gadjian Academy*: Strong educational brand teaching Indonesian HR compliance and taxation.
* **Vulnerabilities & Customer Frustrations**:
  * **Fragmented two-app architecture**: Customers must manage payroll on *Gadjian* and mobile attendance on a separate app (*Hadirr*), causing synchronization delays, double logins, and administrative confusion.
  * Outdated user interface with rigid configuration workflows.
  * Complete absence of operational tooling (no inventory control, no task delegation).

#### 3. Kerjoo
* **Market Position**: Lean, mobile-first attendance tracker originating from Yogyakarta, laser-focused on Indonesian micro-enterprises and UMKM (5–50 employees).
* **Pricing Model**: Ultra-budget, pay-as-you-go pricing starting at approximately **Rp 2,000/employee/day** or **Rp 10,000 to Rp 15,000/employee/month**, with zero setup fees.
* **Core Strengths**:
  * Frictionless mobile experience: Clean, lightweight Android & iOS attendance app with biometric selfie and GPS geofencing.
  * Fast, empathetic customer support via direct WhatsApp chats.
  * Low barrier to adoption: Self-serve setup within 15 minutes.
* **Vulnerabilities & Customer Frustrations**:
  * **Near-zero statutory payroll engine**: Kerjoo is fundamentally an attendance logger. It outputs raw hour/overtime summaries, but lacks automated PPh 21 tax withholding, BPJS deductions, and statutory e-payslip generation.
  * No Kasbon (EWA) or employee financial wellness infrastructure.
  * No multi-store operational utilities (no stock/SKU tracking, no branch task management).
  * Businesses outgrow Kerjoo the moment they hire full-time HR or encounter formal labor department (*Disnaker*) tax/audit requirements.

---

### 1.2 Comprehensive Feature Matrix: APEX vs. Competitors

| Feature Domain | Feature Capability | **APEX (Current)** | **Mekari Talenta** | **Gadjian** | **Kerjoo** |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Workforce & Attendance** | Geo-locked Selfie Clock-in | ✅ (Tamper-proof DB triggers) | ✅ (Face rec + GPS) | ✅ (Via Hadirr app) | ✅ (Face rec + GPS) |
| | Offline-First PWA (No install) | ✅ (IndexedDB sync) | ❌ (Native app only) | ❌ (Native app only) | ❌ (Native app only) |
| | Consent-based Shift Swapping | ✅ (With manager override) | ⚠️ (Manager-assigned only) | ❌ (Manual swap) | ⚠️ (Basic shift swap) |
| | Leave & Permission (Cuti/Izin/Sakit) | ✅ (1-level approval) | ✅ (Multi-tier approval) | ✅ (Standard) | ✅ (Standard) |
| | Multi-Branch Roster & Geofence | ⚠️ (Schema ready, UI WIP) | ✅ (Enterprise tier) | ✅ (Via Hadirr) | ✅ (Multi-location) |
| **Statutory Payroll** | Automated PPh 21 TER Engine | ❌ (Schema stub only) | ✅ (Auto-updated PMK 168) | ✅ (Full compliance) | ❌ (Raw export only) |
| | BPJS Ketenagakerjaan (4 programs) | ❌ (Not implemented) | ✅ (JKK, JKM, JHT, JP) | ✅ (Auto calculated) | ❌ (Not supported) |
| | BPJS Kesehatan (4% + 1% cap) | ❌ (Not implemented) | ✅ (Auto calculated) | ✅ (Auto calculated) | ❌ (Not supported) |
| | Statutory Overtime (*Kepmenaker 102*) | ❌ (Flat rate only) | ✅ (1.5x & 2x multipliers) | ✅ (Auto calculated) | ⚠️ (Hours counted only) |
| | THR (13th Month) Prorated Engine | ❌ (Parked Q1 2027) | ✅ (One-click batch) | ✅ (One-click batch) | ❌ (Not supported) |
| | Bank Disbursal File (BCA/Mandiri/BRI) | ❌ (Not implemented) | ✅ (Corporate batch format) | ✅ (CSV export) | ❌ (Not supported) |
| **Financial Wellness** | Kasbon / Earned Wage Access (EWA) | ❌ (Parked pilot) | ✅ (Via Mekari Flex) | ✅ (Via Payuung) | ❌ (Not supported) |
| **Operations Integration** | High-Density SKU Inventory | ✅ (Live, bulk edit) | ❌ (Requires Jurnal ERP) | ❌ (Not supported) | ❌ (Not supported) |
| | Operations Kanban Task Board | ✅ (Live, drag-and-drop) | ❌ (Not supported) | ❌ (Not supported) | ❌ (Not supported) |
| **Platform & UX** | Multi-Tenant Data Isolation | ✅ (Postgres RLS + Edge) | ✅ (Enterprise cloud) | ✅ (Cloud) | ✅ (Cloud) |
| | WhatsApp-First Notifications & OTP | ⚠️ (Webhook ready, no WABA) | ⚠️ (SMS / Email focus) | ⚠️ (Email focus) | ✅ (WhatsApp support) |
| | Pricing Structure | **Flat Rp 249K/mo (Pro)** | Rp 25K–100K / employee | Rp 18K–25K / employee | Rp 10K–15K / employee |

---

### 1.3 What APEX Has vs. What is Missing

#### What APEX Has (Distinct Unfair Advantages):
1. **The "All-in-One Operations" Moat**: Unlike pure HRIS tools, APEX bundles inventory and task management directly alongside attendance and shifts. For an F&B outlet or retail store manager, having stock counts, opening/closing task checklists, and shift attendance in a single tab eliminates tool fatigue.
2. **True Flat-Rate Pricing**: Charging Rp 249,000/month flat for up to 50 employees provides an unbeatable value proposition. At 45 employees, Mekari costs ~Rp 1,575,000/month and Gadjian costs ~Rp 900,000/month. APEX delivers **72% to 84% direct cash savings**.
3. **Resilient Zero-Burden Client & Offline PWA**: Built with Next.js 16, Supabase, IndexedDB (`idb-keyval`), and local image compression (`browser-image-compression`), APEX operates reliably on budget Android smartphones in basements or remote branches without requiring 100MB Play Store downloads.
4. **Hardened Multi-Tenant Security**: Tenant isolation enforced at both the PostgreSQL Row-Level Security layer and Vercel Edge Middleware, paired with immutable trigger-protected attendance logs.

#### What APEX is Missing (Critical PMF Blockers):
1. **Statutory Tax & Social Security Engine (PPh 21 TER & BPJS)**: **The #1 churn and sales-blocker in Indonesia.** Business owners will not adopt a payroll system if their finance team must manually calculate PPh 21 TER brackets and BPJS caps in Microsoft Excel at month-end.
2. **Statutory THR (Tunjangan Hari Raya) Automation**: By law (Permenaker 6/2016), every Indonesian employer must disburse THR 7 days before religious holidays. Lacking a one-click prorated calculation forces manual accounting and risks labor penalties.
3. **Kasbon (Earned Wage Access / EWA)**: Frontline employee turnover in Indonesia averages 30–45% annually in retail and F&B. EWA gives employees financial breathing room against loan sharks (*pinjol ilegal*), functioning as a major hiring perk for employers.
4. **Dedicated Employee Self-Service (ESS) & WhatsApp Gateway**: Frontline workers rarely check corporate emails. Payslip distribution, clock-in reminders, and leave approvals must flow natively through WhatsApp.
5. **Multi-Branch Regional Wage (UMK) Compliance**: Regional minimum wages (*Upah Minimum Kabupaten/Kota*) differ dramatically across Indonesia (e.g., DKI Jakarta at ~Rp 5,067,381 vs. Kota Yogyakarta at ~Rp 2,492,997). A chain business with outlets in multiple cities cannot run payroll without per-branch UMK baselines.

---

## 2. Technical Specifications: Kasbon (EWA) and THR Features

### 2.1 Feature Specification: Kasbon (Earned Wage Access / EWA)

#### 2.1.1 Regulatory & Compliance Architecture
In Indonesia, Earned Wage Access (EWA) is legally defined as an **accrued wage advance**, distinct from Peer-to-Peer Lending (*Pinjaman Online / P2P* under POJK 10/POJK.05/2022). 

```
                               ┌─────────────────────────────┐
                               │     Employee Requests       │
                               │      Kasbon via APEX        │
                               └──────────────┬──────────────┘
                                              │
                      Validates against Accrued Earned Salary Formula
                      (Max 50% earned-to-date, Min tenure 1 month)
                                              │
                                              ▼
                               ┌─────────────────────────────┐
                               │   Policy Check & Approval   │
                               │   (Auto or Manager Review)  │
                               └──────────────┬──────────────┘
                                              │
                                              ▼
                      ┌──────────────────────────────────────────────┐
                      │ Disbursed via Payment Rail (Xendit / Flip)   │
                      │ Employee receives Net (Amount - Rp 3.500 fee)│
                      └───────────────────────┬──────────────────────┘
                                              │
                                              ▼
                               ┌─────────────────────────────┐
                               │   Payroll Cutoff Engine     │
                               │ Auto-injects line item into │
                               │ payslip_items as Deduction  │
                               └─────────────────────────────┘
```

* **Non-Credit Classification**: No interest may be charged. A flat, transparent administrative/technology fee (Rp 2,500 to Rp 5,000) is levied per transaction.
* **Labor Law Alignment (PP 36/2021 & PP 35/2021)**: Total deductions from an employee's monthly wage must not exceed **50% of total earnings** within that pay period.
* **Capital Liability Model**:
  * *Phase 1 (Pilot)*: Employer-backed float (employer deposits a treasury float or settles directly). Zero balance sheet risk for APEX.
  * *Phase 2 (Production Scale)*: Integrate with an OJK-registered institutional liquidity partner (e.g., GajiGesa, Wagely, or licensed banking partner) via secure REST API.

#### 2.1.2 Accrual Calculation Engine
The system dynamically computes the maximum withdrawable balance using real-time attendance logs:

$$\text{Daily Wage Rate} = \frac{\text{Base Salary} + \text{Fixed Allowances}}{\text{Total Standard Working Days in Month (e.g., 22 or 26)}}$$

$$\text{Earned to Date} = \text{Verified Present Days in Current Cycle} \times \text{Daily Wage Rate}$$

$$\text{Available Kasbon} = \min\left((\text{Earned to Date} \times \text{Company Max \% Cap}) - \sum \text{Active Kasbon in Cycle}, \text{Company Absolute Limit}\right)$$

*Default Parameters*: Max Cap = 50%, Absolute Limit = Rp 2,500,000/request, Minimum Tenure = 30 days, Cooldown = 3 days between requests.

#### 2.1.3 Database Schema (Supabase / PostgreSQL DDL)

```sql
-- Company-wide Kasbon Policy Configuration
CREATE TABLE public.kasbon_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    max_percentage_cap NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (max_percentage_cap BETWEEN 10.00 AND 50.00),
    max_amount_per_request NUMERIC(12,2) NOT NULL DEFAULT 2000000.00,
    min_tenure_days INTEGER NOT NULL DEFAULT 30,
    cooldown_days INTEGER NOT NULL DEFAULT 3,
    admin_fee NUMERIC(8,2) NOT NULL DEFAULT 3500.00,
    fee_borne_by VARCHAR(10) NOT NULL DEFAULT 'employee' CHECK (fee_borne_by IN ('employee', 'employer')),
    auto_approve_below NUMERIC(12,2) DEFAULT 500000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_kasbon_policy UNIQUE (company_id)
);

-- Individual Kasbon Requests & Lifecycle
CREATE TYPE public.kasbon_status AS ENUM (
    'pending', 
    'approved', 
    'processing_payout', 
    'disbursed', 
    'rejected', 
    'deducted_in_payroll', 
    'cancelled'
);

CREATE TABLE public.kasbon_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount_requested NUMERIC(12,2) NOT NULL CHECK (amount_requested >= 50000.00),
    admin_fee NUMERIC(8,2) NOT NULL,
    net_disbursed NUMERIC(12,2) NOT NULL,
    earned_to_date_snapshot NUMERIC(12,2) NOT NULL,
    pay_period_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    status public.kasbon_status NOT NULL DEFAULT 'pending',
    destination_bank VARCHAR(20) NOT NULL,
    destination_account_number VARCHAR(30) NOT NULL,
    destination_account_name VARCHAR(100) NOT NULL,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    disbursement_ref VARCHAR(100),
    disbursed_at TIMESTAMPTZ,
    payroll_run_id UUID, -- Foreign key linked once payroll is executed
    idempotency_key UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for payroll cutoff queries
CREATE INDEX idx_kasbon_payroll_cutoff 
ON public.kasbon_requests (company_id, user_id, pay_period_month, status);

-- Enable RLS
ALTER TABLE public.kasbon_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kasbon_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Employees view their own requests, Admins/Managers view company requests
CREATE POLICY "Users can view own kasbon requests"
ON public.kasbon_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Managers can view company kasbon requests"
ON public.kasbon_requests FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
);
```

#### 2.1.4 API Endpoints & Business Logic
1. `GET /api/kasbon/eligibility`: Returns `earned_to_date`, `max_allowed`, `active_kasbon_sum`, and `is_eligible` (checks tenure and cooldown).
2. `POST /api/kasbon/request`: Validates limits inside a PostgreSQL transaction (`SELECT ... FOR UPDATE`), creates `kasbon_requests` with `pending` status. If amount $\le$ `auto_approve_below`, triggers auto-approval.
3. `POST /api/kasbon/approve`: Restricted to Manager/Admin. Sets status to `approved` and dispatches payment event.
4. `POST /api/kasbon/webhook/payout`: Webhook from disbursement rail (e.g., Xendit/Flip). Updates status to `disbursed` and sends WhatsApp notification to the employee.

---

### 2.2 Feature Specification: THR (Tunjangan Hari Raya) Engine

#### 2.2.1 Indonesian Statutory Law & Calculations
* **Regulatory Standard**: *Peraturan Menteri Ketenagakerjaan (Permenaker) No. 6 Tahun 2016* & *Peraturan Pemerintah (PP) No. 36 Tahun 2021*.
* **Mandatory Timing**: Must be paid out at least **7 calendar days before the employee's respective religious holiday** ($H-7$). In practice across Indonesia, businesses disburse THR prior to *Idul Fitri* (for Muslim workers) or *Natal* (for Christian workers), or run a synchronized company-wide batch before *Idul Fitri*.
* **Statutory Late Penalty**: Failure to disburse on time results in a **5% statutory fine** on the total unpaid THR, which must be allocated toward employee welfare.

```
                                  [EMPLOYEE TENURE CHECK]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             Tenure >= 12 Months                         Tenure 1 - 12 Months
                       │                                           │
             THR = 1 x Monthly Wage                      THR = (Months / 12) x Monthly Wage
             (Base + Fixed Allowance)                    (Prorated to exact day/month)
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                                [TAX CALCULATION: PPh 21 TER]
                       Aggregated with monthly wage in payment month
                       Apply PP 58/2023 TER Category A/B/C rate on total
                                             │
                                             ▼
                                [THR PAYSLIP & BANK BATCH]
                       Distinct line item + BCA/Mandiri CSV export
```

#### 2.2.2 Exact Computation Formulas
1. **Full Eligibility ($\ge$ 12 Months Service)**:
   $$\text{THR Gross} = 1 \times (\text{Gaji Pokok} + \text{Tunjangan Tetap})$$
   *(Note: Variable allowances like transport or meal reimbursements based on daily attendance are legally excluded).*
2. **Prorated Eligibility (1 Month $\le$ Tenure < 12 Months)**:
   $$\text{THR Gross} = \left(\frac{\text{Tenure in Months}}{12}\right) \times (\text{Gaji Pokok} + \text{Tunjangan Tetap})$$
   *Exact Days Proration*: In cases of dispute, tenure is calculated as $\frac{\text{Days Employed}}{365} \times \text{Monthly Wage}$.
3. **Daily Workers (*Karyawan Harian Lepas*)**:
   * Tenure $\ge$ 12 months: Average wage earned over the preceding 12 months.
   * Tenure < 12 months: Average wage earned over the duration of actual employment.
4. **PPh 21 TER (Tarif Efektif Rata-rata) Application**:
   Under *PP 58/2023*, in the month THR is disbursed:
   $$\text{Total Gross Income} = \text{Monthly Regular Salary} + \text{Gross THR}$$
   $$\text{Total PPh 21 Withheld} = \text{Total Gross Income} \times \text{TER Rate}(\text{PTKP Category}, \text{Total Gross Income})$$
   $$\text{PPh 21 on THR} = \text{Total PPh 21 Withheld} - \text{Regular Monthly PPh 21}$$

#### 2.2.3 Database Schema (Supabase / PostgreSQL DDL)

```sql
-- Campaign for scheduling and tracking company THR events
CREATE TABLE public.thr_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2026),
    holiday_type VARCHAR(30) NOT NULL DEFAULT 'idul_fitri' 
        CHECK (holiday_type IN ('idul_fitri', 'natal', 'imlek', 'waisak', 'nyepi', 'universal')),
    holiday_date DATE NOT NULL,
    statutory_deadline DATE NOT NULL, -- H-7 before holiday_date
    cutoff_date DATE NOT NULL, -- Date used to freeze employee tenure calculation
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'simulated', 'approved', 'disbursed', 'closed')),
    total_disbursed NUMERIC(16,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual employee THR item calculation
CREATE TABLE public.thr_employee_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thr_campaign_id UUID NOT NULL REFERENCES public.thr_campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    join_date DATE NOT NULL,
    tenure_months INTEGER NOT NULL,
    tenure_days INTEGER NOT NULL,
    is_prorated BOOLEAN NOT NULL DEFAULT false,
    base_salary_snapshot NUMERIC(12,2) NOT NULL,
    fixed_allowances_snapshot NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    wage_basis NUMERIC(12,2) NOT NULL,
    gross_thr NUMERIC(12,2) NOT NULL,
    pph21_ter_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
    pph21_tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_thr_payable NUMERIC(12,2) NOT NULL,
    bank_name VARCHAR(30),
    bank_account_number VARCHAR(40),
    bank_account_holder VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'paid', 'excluded')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_thr_employee_campaign UNIQUE (thr_campaign_id, user_id)
);

-- Indexing for fast batch queries
CREATE INDEX idx_thr_campaign_user ON public.thr_employee_calculations (thr_campaign_id, status);
```

#### 2.2.4 Payroll & Accounting Integration Points
* **Dedicated Separate Batch or Merged Run**: APEX will support two distribution models:
  1. *Standalone THR Payout*: Generates a dedicated THR slip and bank batch file 1–2 weeks before Hari Raya.
  2. *Integrated Payroll Payout*: Merged into the standard monthly payroll cycle.
* **Banking Disbursal Exporters**: One-click generation of formatted batch transfer files:
  * **BCA Payroll (KlikBCA Bisnis)**: Fixed-width `.txt` / `.csv` format.
  * **Mandiri Cash Management (MCM)**: Standard 16-column CSV layout.
  * **Xendit / Midtrans Iris Batch Payout API**: Direct automated disbursement.

---

## 3. Indonesian-First UX & Onboarding Improvements

### 3.1 Indonesian-First UX Principles

1. **Contextual Bahasa Indonesia Terminology**:
   Eliminate alienating Silicon Valley SaaS jargon. Replace generic English labels with everyday Indonesian operational terms:

| English Tech Jargon | APEX Natural Bahasa Term | Contextual Rationale |
| :--- | :--- | :--- |
| Clock-In / Clock-Out | **Absen Masuk / Absen Pulang** | Instantly recognizable across Indonesian factory and F&B staff |
| Overtime | **Lembur (1.5x / 2x)** | Explicitly tied to Indonesian Ministry of Manpower rules |
| Earned Wage Access (EWA) | **Kasbon Mandiri** | "Kasbon" is universally understood; "Mandiri" emphasizes dignity |
| Payslip | **Slip Gaji Resmi** | Conveys legality and transparency |
| Shift Swap | **Tukar Shift (Atur Jadwal)** | Clear, friendly action label |
| Time-off / Leave | **Pengajuan Cuti & Izin** | Respects Indonesian statutory types: Cuti Tahunan, Izin, Sakit |

2. **Handling Cultural Operational Habits**:
   * **Toleransi Keterlambatan (Grace Period)**: Indonesian businesses frequently provide a 5 to 15-minute grace period before marking an employee "Late" (*Terlambat*). APEX must include a configurable slider in company settings.
   * **Shift Malam Melintasi Tengah Malam (Cross-Midnight Shifts)**: Night shifts in F&B, security, and healthcare (e.g., 22:00 to 07:00) often break basic date-range queries. Attendance sessions must bind to the `shift_roster_id` rather than local calendar dates.
   * **Device Realities**: The majority of frontline Indonesian staff use sub-$150 Android devices (Oppo, Vivo, Xiaomi) with limited storage and RAM. Keeping the client bundle under 150KB and compressing selfie images to <100KB locally prior to upload ensures near-zero crash rates.

---

### 3.2 WhatsApp-Centric Architecture & Onboarding CTA

In Indonesia, WhatsApp is not merely a chat application—it is the de-facto mobile operating system for commerce and management.

```
      [Landing Page / Pricing]
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
[Try Free 14-Days]   [Konsultasi via WA]
(Web Wizard)         (Direct Click-to-Chat)
                            │
                            ▼
               [Pre-Filled WA Inquiry]
               "Halo Tim APEX, saya pemilik bisnis sektor
                [F&B] dengan [35] karyawan..."
```

#### 1. Smart WhatsApp Marketing CTA Widget
* Floating bottom-right widget on marketing and pricing pages.
* Pre-populates dynamic context into the chat link:
  ```typescript
  export function getWhatsAppInquiryUrl(employeeCount: number, industry: string) {
    const phone = "6281234567890"; // APEX Official WhatsApp Business Number
    const message = encodeURIComponent(
      `Halo Tim APEX, saya pemilik bisnis sektor ${industry} dengan sekitar ${employeeCount} karyawan. ` +
      `Saya ingin konsultasi migrasi sistem absensi & payroll ke APEX.`
    );
    return `https://wa.me/${phone}?text=${message}`;
  }
  ```

#### 2. WhatsApp OTP & Direct Employee Onboarding
* Frontline employees frequently lack active corporate Google/email accounts or forget passwords.
* **Authentication via WhatsApp OTP**: The employee enters their Indonesian WhatsApp number (`+628...`), receives a 6-digit cryptographic OTP, and logs in immediately without password friction.

#### 3. Automated Slip Gaji & Notification Bot
* **PDF Payslip Dispatch**: Upon payroll finalization, employees receive a direct WhatsApp message from the verified APEX Business Account:
  > *"Halo Budi, slip gaji bulan Agustus 2026 Anda telah terbit. Total Gaji Bersih: Rp 4.850.000. Unduh slip resmi terenkripsi di tautan berikut: [apex.lankdev.my.id/s/xyz123]. Masukkan 4-digit tahun lahir Anda sebagai kata sandi."*
* **Attendance Nudge**: 15 minutes before shift start: *"Shift Pagi Anda di Cabang Senopati dimulai pukul 08:00 WIB. Jangan lupa lakukan Absen Selfie sebelum waktu toleransi berakhir."*

---

### 3.3 Interactive Pricing Calculator & Competitor Comparison

The pricing page must actively educate prospects on their savings vs. Mekari Talenta and Gadjian through an interactive calculator.

#### Calculator Logic & Tiers:
* **Headcount Range**: Slider from 5 to 300 employees.
* **APEX Pricing Structure**:
  * **Free Starter**: 1–15 employees $\rightarrow$ **Rp 0 / month** (Attendance, Tasks, Leave).
  * **Pro Operational (Flat)**: 16–50 employees $\rightarrow$ **Rp 249,000 / month flat** (Full suite: Attendance, Shifts, Payroll, Inventory, Tasks).
  * **Growth Tier**: 51–200 employees $\rightarrow$ **Rp 4,500 / employee / month** (Includes Kasbon EWA + Multi-branch sync).
  * **Enterprise**: 200+ employees $\rightarrow$ Custom negotiation.
* **Competitor Benchmark Baselines**:
  * Mekari Talenta: ~Rp 35,000 / employee / month + Rp 5,000,000 annualized setup amortization.
  * Gadjian: ~Rp 20,000 / employee / month.
  * Kerjoo: ~Rp 12,000 / employee / month.

#### React / TypeScript Implementation Component (`PricingCalculator.tsx`):

```tsx
"use client";

import React, { useState, useMemo } from "react";
import { Check, ShieldCheck, MessageSquareText, TrendingDown } from "lucide-react";

export default function PricingCalculator() {
  const [headcount, setHeadcount] = useState<number>(35);
  const [includeTaxModule, setIncludeTaxModule] = useState<boolean>(true);
  const [includeWhatsAppAddon, setIncludeWhatsAppAddon] = useState<boolean>(true);

  const calculations = useMemo(() => {
    // 1. Calculate APEX Price
    let apexBase = 0;
    let tierName = "Pro Flat";

    if (headcount <= 15) {
      apexBase = 0;
      tierName = "Free Starter";
    } else if (headcount <= 50) {
      apexBase = 249000;
      tierName = "Pro Flat";
    } else {
      apexBase = headcount * 4500;
      tierName = "Growth Scale";
    }

    const taxAddon = includeTaxModule ? (headcount > 15 ? headcount * 1500 : 0) : 0;
    const waAddon = includeWhatsAppAddon ? (headcount > 15 ? 49000 : 0) : 0;
    const totalApex = apexBase + taxAddon + waAddon;

    // 2. Calculate Competitor Prices
    const talentaMonthly = headcount * 35000 + 416666; // Includes amortized Rp 5M onboarding fee
    const gadjianMonthly = headcount * 20000;
    const kerjooMonthly = headcount * 12000;

    // 3. Savings against Talenta
    const monthlySavingsTalenta = Math.max(0, talentaMonthly - totalApex);
    const annualSavingsTalenta = monthlySavingsTalenta * 12;
    const savingsPercent = Math.round((monthlySavingsTalenta / talentaMonthly) * 100);

    return {
      totalApex,
      tierName,
      talentaMonthly,
      gadjianMonthly,
      kerjooMonthly,
      monthlySavingsTalenta,
      annualSavingsTalenta,
      savingsPercent,
    };
  }, [headcount, includeTaxModule, includeWhatsAppAddon]);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 shadow-2xl">
      <div className="text-center mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full">
          Kalkulator Efisiensi Investasi HR
        </span>
        <h2 className="text-2xl md:text-3xl font-bold mt-3 text-white">
          Bandingkan Biaya APEX vs. Software HR Lain
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Buktikan transparansi harga flat APEX tanpa biaya tersembunyi per karyawan.
        </p>
      </div>

      {/* Slider Control */}
      <div className="mb-8 p-6 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-medium text-slate-300">Jumlah Karyawan Aktif:</label>
          <span className="text-3xl font-extrabold text-emerald-400 bg-slate-800 px-4 py-1 rounded-lg border border-slate-700">
            {headcount} <span className="text-xs font-normal text-slate-400">Orang</span>
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={150}
          step={1}
          value={headcount}
          onChange={(e) => setHeadcount(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
          <span>5 Karyawan</span>
          <span>50 (Batas Kuota Flat Pro)</span>
          <span>150 Karyawan</span>
        </div>
      </div>

      {/* Optional Add-on Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <label className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
          <input
            type="checkbox"
            checked={includeTaxModule}
            onChange={(e) => setIncludeTaxModule(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-300">
            Modul PPh 21 TER & BPJS (+Rp 1.500/karyawan)
          </span>
        </label>
        <label className="flex items-center space-x-3 p-3 bg-slate-800/30 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700 transition">
          <input
            type="checkbox"
            checked={includeWhatsAppAddon}
            onChange={(e) => setIncludeWhatsAppAddon(e.target.checked)}
            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-300">
            WhatsApp Gateway & E-Payslip Bot (+Rp 49.000/bln)
          </span>
        </label>
      </div>

      {/* Side by Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* APEX Card */}
        <div className="p-5 bg-gradient-to-b from-emerald-950/40 to-slate-900 border-2 border-emerald-500 rounded-xl relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
            Solusi Rekomendasi
          </div>
          <h3 className="text-lg font-bold text-white mb-1">APEX HR</h3>
          <span className="text-xs text-emerald-400 font-mono">{calculations.tierName}</span>
          <div className="text-2xl font-black text-emerald-400 my-4">
            {formatIDR(calculations.totalApex)}
            <span className="text-xs font-normal text-slate-400"> /bulan</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Absensi Selfie & Roster Shift</li>
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Manajemen Stok & Task Kanban</li>
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Fitur Kasbon Mandiri (EWA)</li>
            <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Tanpa Biaya Setup (Rp 0)</li>
          </ul>
        </div>

        {/* Talenta Card */}
        <div className="p-5 bg-slate-800/20 border border-slate-800 rounded-xl">
          <h3 className="text-lg font-bold text-slate-300 mb-1">Mekari Talenta</h3>
          <span className="text-xs text-slate-500 font-mono">Per-Employee + Setup Fee</span>
          <div className="text-2xl font-black text-rose-400 my-4">
            {formatIDR(calculations.talentaMonthly)}
            <span className="text-xs font-normal text-slate-400"> /bulan</span>
          </div>
          <p className="text-xs text-slate-500">
            Dikenakan tarif Rp 35K/karyawan + estimasi biaya setup awal diangsur tahunan.
          </p>
        </div>

        {/* Gadjian Card */}
        <div className="p-5 bg-slate-800/20 border border-slate-800 rounded-xl">
          <h3 className="text-lg font-bold text-slate-300 mb-1">Gadjian + Hadirr</h3>
          <span className="text-xs text-slate-500 font-mono">Dual-App Subscription</span>
          <div className="text-2xl font-black text-amber-400 my-4">
            {formatIDR(calculations.gadjianMonthly)}
            <span className="text-xs font-normal text-slate-400"> /bulan</span>
          </div>
          <p className="text-xs text-slate-500">
            Tarif Rp 20K/karyawan. Dua aplikasi terpisah untuk payroll dan absensi.
          </p>
        </div>
      </div>

      {/* ROI & Savings Banner */}
      <div className="p-5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <TrendingDown className="w-4 h-4" /> Hemat {calculations.savingsPercent}% Anggaran HR
          </div>
          <div className="text-slate-200 text-sm mt-0.5">
            Bisnis Anda menghemat perkiraan <strong className="text-white underline decoration-emerald-500">{formatIDR(calculations.annualSavingsTalenta)}</strong> per tahun bersama APEX.
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition"
          >
            <MessageSquareText className="w-4 h-4" /> Tanya Tim via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Prioritized Roadmap Matrix (High Impact / Low Effort)

### 4.1 The 2x2 Value-to-Effort Matrix

```
   HIGH IMPACT ▲
               │
               │  [QUADRANT 1: QUICK WINS]            │  [QUADRANT 2: STRATEGIC BETS]
               │  • PPh 21 TER Calculation Table      │  • BPJS TK & Kesehatan Full Engine
               │  • WhatsApp OTP & Notification Webhook│  • Native Android App MVP (Capacitor)
               │  • Interactive Pricing Calculator    │  • One-Click THR Batch Run
               │  • Overtime (Lembur 1.5x/2x) Engine  │  • Kasbon (EWA) Core + Payout Rail
               │  • Indonesian E-Payslip PDF Stream   │  • Multi-Branch UMK Hierarchy
               │                                      │
  ─────────────┼──────────────────────────────────────┼──────────────────────────────────────►
               │                                      │                         HIGH EFFORT
               │  [QUADRANT 3: FILL-INS]              │  [QUADRANT 4: DEPTH TRAPS / AVOID]
               │  • Selfie Liveness Blink Detection   │  • Self-Funded Lending Balance Sheet
               │  • Geofence Visual Map Radius UI     │  • Enterprise ATS & AI Resume Parser
               │  • KlikBCA / Mandiri CSV Exporters   │  • 360-Degree Appraisal Matrix
               │  • Pre-built Vertical Shift Models   │  • Biometric Fingerprint Hardware Sync
               │                                      │
               ▼ LOW IMPACT
```

---

### 4.2 RICE Scoring Breakdown for Candidate Features

| Feature Initiative | Reach (1–10) | Impact (0.5–3) | Confidence (0–100%) | Effort (Person-Weeks) | RICE Score | Priority Tier |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **PPh 21 TER Calculation Engine** | 10 | 3.0 (Massive) | 90% | 2 weeks | **135.0** | **P0 (Sprint 1)** |
| **Interactive Pricing & ROI Calculator** | 9 | 2.5 (High) | 95% | 1 week | **213.7** | **P0 (Sprint 1)** |
| **WhatsApp Notification & Slip Bot** | 10 | 2.5 (High) | 90% | 1.5 weeks | **150.0** | **P0 (Sprint 1)** |
| **Statutory Overtime (*Lembur*) Engine** | 8 | 2.0 (High) | 95% | 1 week | **152.0** | **P0 (Sprint 2)** |
| **Statutory THR (13th Month) Batch** | 10 | 3.0 (Massive) | 90% | 2.5 weeks | **108.0** | **P0 (Sprint 2)** |
| **Kasbon / EWA Engine (Pilot Rail)** | 8 | 2.5 (High) | 85% | 3 weeks | **56.6** | **P1 (Sprint 3)** |
| **BPJS Ketenagakerjaan & Kesehatan** | 9 | 2.5 (High) | 80% | 3 weeks | **60.0** | **P1 (Sprint 3)** |
| **Bank Disbursal CSV Exporters** | 7 | 1.5 (Med) | 95% | 1 week | **99.7** | **P1 (Sprint 4)** |
| **Native Android Mobile App MVP** | 9 | 3.0 (Massive) | 80% | 5 weeks | **43.2** | **P1 (Sprint 4)** |
| **Multi-Branch Multi-UMK Structure** | 6 | 2.0 (High) | 85% | 2.5 weeks | **40.8** | **P2 (Sprint 5)** |
| **Liveness Anti-Spoofing Check** | 6 | 1.0 (Low) | 90% | 1 week | **54.0** | **P2 (Sprint 5)** |

$$\text{RICE Score} = \frac{\text{Reach} \times \text{Impact} \times \text{Confidence}}{\text{Effort}}$$

---

### 4.3 Actionable Implementation Roadmap & Technical Notes

#### Sprint 1 (Weeks 1–2): High-Impact Compliance & Conversion Engine
* **Deliverable 1.1: PPh 21 TER Engine (PP 58/2023 & PMK 168/2023)**:
  * *Implementation*: Create PostgreSQL lookup table `tax_ter_rates` containing the statutory bands for Categories A, B, and C.
  * *Logic*: In Next.js Server Action, compute taxable gross income $\rightarrow$ lookup effective rate based on employee's PTKP status (e.g., TK/0 $\rightarrow$ Category A) $\rightarrow$ apply exact deduction.
* **Deliverable 1.2: WhatsApp Gateway Integration**:
  * *Implementation*: Connect Qiscus or Twilio WhatsApp Business API. Implement serverless webhook at `/api/webhooks/whatsapp` to trigger notifications when leave is approved or payslips are generated.
* **Deliverable 1.3: Pricing Calculator on Landing Page**:
  * *Implementation*: Deploy `PricingCalculator.tsx` to marketing root (`/pricing`). Add dynamic WhatsApp click-to-chat CTA to route qualified leads directly to sales.

#### Sprint 2 (Weeks 3–4): Statutory Overtime & Indonesian Payslip Generation
* **Deliverable 2.1: Kepmenaker 102/2004 Statutory Overtime Calculator**:
  * *Implementation*: Replace flat hourly overtime with Indonesian statutory multipliers:
    * Workday overtime: 1.5x hourly wage for the 1st hour; 2.0x for subsequent hours.
    * Rest day / Public holiday overtime: 2.0x for the first 7 hours; 3.0x for the 8th hour; 4.0x for the 9th hour and beyond.
    * Hourly wage formula: $\frac{\text{Base Salary} + \text{Fixed Allowances}}{173}$.
* **Deliverable 2.2: Official Indonesian Payslip Streamer**:
  * *Implementation*: PDF generator streaming a localized, professional slip displaying: Gaji Pokok, Tunjangan Tetap, Upah Lembur, Potongan BPJS, Potongan PPh 21 TER, and Potongan Kasbon with company signature stamp.

#### Sprint 3 (Weeks 5–6): THR Automation & Kasbon Pilot
* **Deliverable 3.1: THR One-Click Batch Engine**:
  * *Implementation*: Apply `thr_campaigns` and `thr_employee_calculations` schema. Build preview simulation table with tenure auto-detection from `users.created_at` or `employee_payroll_settings.join_date`.
* **Deliverable 3.2: Kasbon (EWA) Pilot Module**:
  * *Implementation*: Roll out `kasbon_requests` table to 5 selected pilot tenants. Provide manager approval queue and manual settlement export before connecting automated disbursement APIs.

#### Sprint 4 (Weeks 7–8): BPJS Engine & Bank Batch Disbursements
* **Deliverable 4.1: BPJS Ketenagakerjaan & Kesehatan Engine**:
  * *BPJS Ketenagakerjaan*:
    * JHT (Hari Tua): 3.7% employer, 2.0% employee.
    * JKK (Kecelakaan Kerja): 0.24% to 1.74% (industry risk class) employer only.
    * JKM (Kematian): 0.30% employer only.
    * JP (Pensiun): 2.0% employer, 1.0% employee (capped at national maximum wage cap: Rp 10,042,300).
  * *BPJS Kesehatan*: 4.0% employer, 1.0% employee (capped at national maximum salary ceiling: Rp 12,000,000).
* **Deliverable 4.2: Bank Transfer Exporters**:
  * Export batch payroll files compatible with BCA KlikBCA Bisnis and Mandiri Cash Management (MCM).

#### Sprint 5 (Weeks 9–10): Mobile Experience & Multi-Branch Architecture
* **Deliverable 5.1: Native Mobile Shell (Capacitor / React Native MVP)**:
  * Wrap APEX PWA with Capacitor or deploy lightweight Expo client focused exclusively on the Employee Portal: Absen Selfie, Jadwal Shift, Pengajuan Cuti, and Unduh Slip Gaji.
* **Deliverable 5.2: Multi-Branch UMK Hierarchy**:
  * Add `branch_id` and `regional_umk` to company settings to guarantee proper minimum wage compliance across decentralized chains.

---

## 5. Strategic Architectural Guidance: Supabase & Next.js 16

To maintain APEX's "Zero-Burden Client" philosophy, adhere to the following engineering patterns:

1. **Idempotency & Race-Condition Prevention in Financial Modules**:
   * All balance withdrawals (Kasbon) and batch disbursements (THR) must use database-level row locking:
     ```sql
     -- Prevent double-withdrawal exploits
     BEGIN;
     SELECT id, amount_requested FROM public.kasbon_requests 
     WHERE id = request_id AND status = 'pending' 
     FOR UPDATE;
     -- Proceed with status update & ledger write
     COMMIT;
     ```
2. **Audit Logging & Tamper-Proofing**:
   * Statutory calculations must snapshot the exact tax rules and wage basis into JSONB columns (`tax_rule_snapshot`) on `payslip_items` and `thr_employee_calculations`. If statutory tax brackets change in future years, historical payslips remain permanently verifiable.
3. **Storage Security for Sensitive Financial Artifacts**:
   * All generated payslip PDFs and bank export spreadsheets must be stored in private Supabase Storage buckets with strict RLS policies, accessible only via time-limited signed URLs (5-minute TTL).

---

## 6. Verification Checklist & Success Metrics

| Milestone / Metric | Verification Standard | Target Threshold |
| :--- | :--- | :---: |
| **PPh 21 TER Precision** | Tested against 50 synthetic test cases across PTKP TK/0 through K/3 | 100% match with official DJP Coretax tables |
| **THR Proration Accuracy** | Verified across employees with 15 days, 4 months, and 3 years tenure | Zero rounding discrepancy |
| **Kasbon Payout Latency** | Time from employee confirmation to disbursement webhook acknowledgment | < 30 seconds |
| **Landing Page Conversion** | Prospects interacting with Pricing Calculator who click WhatsApp CTA | $\ge 8.5\%$ conversion rate |
| **Onboarding Velocity** | Time required for new tenant to configure company, branches, and invite first 10 staff | < 5 minutes |

---

*End of Report. Ready for direct implementation across the APEX codebase.*

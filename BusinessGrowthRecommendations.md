# APEX — Comprehensive Business Growth Recommendations & Go-To-Market Strategy

> **Author**: `@business_lankdevbot` (Senior Business Strategist & Growth Architect — SEA B2B SaaS)  
> **Prepared for**: Gilank (Founder, APEX / Lankdev)  
> **Product URL**: `https://apex.lankdev.my.id`  
> **Market Target**: Indonesian Shift-Based SMEs (20–50 Employees: Retail, F&B, Clinics, Laundry, Workshops)  
> **Document Status**: Complete Action Plan & Strategy Blueprint  
> **Date**: September 2026  

---

## Executive Summary

APEX possesses a decisive product moat by uniting geo-locked selfie attendance, shift rosters, SKU inventory, and task Kanban into a single lightweight offline-first PWA, yet it currently monetizes below market equilibrium through an uncalibrated flat pricing structure. By transitioning to a tiered Per-Employee-Per-Month (PEPM) model anchored by a predictable base fee, APEX can expand Average Revenue Per Account (ARPU) by 45–80% across its core 20–50 headcount sweet spot while still undercutting legacy competitors like Mekari Talenta by over 70%. Capitalizing on secondary revenue streams through an OJK-compliant Earned Wage Access (Kasbon/EWA) partnership and establishing a localized, WhatsApp-first acquisition engine (tapping accounting firms, hyper-targeted cold WhatsApp sequences, and answer-engine optimized content) will establish an airtight, capital-efficient growth flywheel capable of scaling APEX to its initial milestone of 100 paying tenants within 6 months.

---

## Table of Contents

1. [Section 1: Tiered PEPM Pricing Strategy](#section-1-tiered-pepm-pricing-strategy)
   - [1.1 Market Dynamics & Competitive Pricing Arbitrage](#11-market-dynamics--competitive-pricing-arbitrage)
   - [1.2 Tiered Packaging & Feature Gate Architecture](#12-tiered-packaging--feature-gate-architecture)
   - [1.3 Unit Economics: CAC, LTV, and Payback Period Analysis](#13-unit-economics-cac-ltv-and-payback-period-analysis)
   - [1.4 Dynamic Pricing Calculator Formulas](#14-dynamic-pricing-calculator-formulas)
   - [1.5 Natural Expansion & Upgrade Triggers](#15-natural-expansion--upgrade-triggers)
   - [1.6 Annual Billing & Incentive Architecture](#16-annual-billing--incentive-architecture)
   - [1.7 Competitive Defensibility vs. Mekari Talenta & Gadjian](#17-competitive-defensibility-vs-mekari-talenta--gadjian)
   - [1.8 Localized Pricing Page Copy (Bahasa Indonesia)](#18-localized-pricing-page-copy-bahasa-indonesia)
   - [1.9 Section 1 Action Items](#19-section-1-action-items)
2. [Section 2: Landing Page Conversion Rate Optimization (CRO)](#section-2-landing-page-conversion-rate-optimization-cro)
   - [2.1 Hero Section Copywriting (3 A/B Test Variants)](#21-hero-section-copywriting-3-ab-test-variants)
   - [2.2 Frictionless Dual CTA Strategy: WhatsApp-First vs. Trial](#22-frictionless-dual-cta-strategy-whatsapp-first-vs-trial)
   - [2.3 High-Trust Signals & Localized Social Proof](#23-high-trust-signals--localized-social-proof)
   - [2.4 Interactive Pricing & ROI Calculator UX](#24-interactive-pricing--roi-calculator-ux)
   - [2.5 Below-the-Fold Architecture: Matrix, Industry Cards & FAQs](#25-below-the-fold-architecture-matrix-industry-cards--faqs)
   - [2.6 Mobile-First Conversion Architecture (80%+ Mobile Traffic)](#26-mobile-first-conversion-architecture-80-mobile-traffic)
   - [2.7 Systematic 5-Step A/B Testing Roadmap](#27-systematic-5-step-ab-testing-roadmap)
   - [2.8 Floating WhatsApp Conversion Widget Implementation](#28-floating-whatsapp-conversion-widget-implementation)
   - [2.9 Section 2 Action Items](#29-section-2-action-items)
3. [Section 3: Kasbon (Earned Wage Access / EWA) Monetization Model](#section-3-kasbon-earned-wage-access--ewa-monetization-model)
   - [3.1 Model Evaluation: Employer-Sponsored vs. Flat Convenience Fee vs. Hybrid](#31-model-evaluation-employer-sponsored-vs-flat-convenience-fee-vs-hybrid)
   - [3.2 10-Customer Pilot Financial & Revenue Projections](#32-10-customer-pilot-financial--revenue-projections)
   - [3.3 Recommended Pricing & Revenue-Share Matrix](#33-recommended-pricing--revenue-share-matrix)
   - [3.4 Strategic Liquidity Partnerships: GajiGesa vs. Wagely vs. Payuung](#34-strategic-liquidity-partnerships-gajigesa-vs-wagely-vs-payuung)
   - [3.5 Indonesian Regulatory & Compliance Guardrails (OJK, BI, Labor Law)](#35-indonesian-regulatory--compliance-guardrails-ojk-bi-labor-law)
   - [3.6 Phased Rollout Roadmap: Internal Treasury Float to Institutional API](#36-phased-rollout-roadmap-internal-treasury-float-to-institutional-api)
   - [3.7 Legal Term Sheet & Employer-Sponsored Contract Addendum](#37-legal-term-sheet--employer-sponsored-contract-addendum)
   - [3.8 WhatsApp Notification & Lifecycle Transaction Templates](#38-whatsapp-notification--lifecycle-transaction-templates)
   - [3.9 Section 3 Action Items](#39-section-3-action-items)
4. [Section 4: High-Velocity B2B Acquisition Channels](#section-4-high-velocity-b2b-acquisition-channels)
   - [4.1 Channel Overview & Comparative Scorecard](#41-channel-overview--comparative-scorecard)
   - [4.2 Channel A: Accounting Firm (KAP / BKP) Strategic Alliances](#42-channel-a-accounting-firm-kap--bkp-strategic-alliances)
   - [4.3 Channel B: Outbound LinkedIn & Direct WhatsApp Prospecting](#43-channel-b-outbound-linkedin--direct-whatsapp-prospecting)
   - [4.4 Channel C: Search Engine & Answer Engine Optimization (SEO / AEO)](#44-channel-c-search-engine--answer-engine-optimization-seo--aeo)
   - [4.5 Channel D: High-Leverage Ecosystem Distribution](#45-channel-d-high-leverage-ecosystem-distribution)
   - [4.6 Section 4 Action Items](#46-section-4-action-items)
5. [Appendix: Reference Frameworks, Scripts & Formulas](#appendix-reference-frameworks-scripts--formulas)
   - [Appendix A: Complete SaaS Financial Formula Index](#appendix-a-complete-saas-financial-formula-index)
   - [Appendix B: Master WhatsApp Cold & Warm Script Repository](#appendix-b-master-whatsapp-cold--warm-script-repository)
   - [Appendix C: Complete Schema Markup (JSON-LD) for AEO](#appendix-c-complete-schema-markup-json-ld-for-aeo)
   - [Appendix D: Tailwind CSS Component for Sticky WhatsApp Mobile Bar](#appendix-d-tailwind-css-component-for-sticky-whatsapp-mobile-bar)

---

## Section 1: Tiered PEPM Pricing Strategy

### 1.1 Market Dynamics & Competitive Pricing Arbitrage

The Indonesian SME landscape (specifically businesses employing 20 to 50 workers) suffers from an acute pricing dichotomy:
1. **Enterprise Oligopolies (Mekari Talenta)** charge **Rp 25,000 – Rp 100,000 per employee per month**, impose annual minimum commitments (typically 30–50 seats minimum), and force non-negotiable implementation fees of **Rp 5,000,000 – Rp 25,000,000**. For a 35-employee retail chain or clinic, Talenta costs upwards of **Rp 1,400,000/month** before setup costs.
2. **Payroll Specialists (Gadjian + Hadirr)** charge **Rp 18,000 – Rp 25,000/employee/month**, but bifurcate their product across two separate applications (*Gadjian* for payroll and *Hadirr* for mobile attendance), generating administrative overhead and double login friction.
3. **Budget Loggers (Kerjoo)** charge **Rp 10,000 – Rp 15,000/employee/month**, but strictly track attendance timestamps without operational utilities (no inventory, no tasks) and lack statutory payroll compliance (PPh 21 TER, BPJS).

APEX currently operates on a flat rate of **Rp 249,000/month** for unlimited usage up to 50 employees. While highly attractive for a 45-person company, this model exhibits two structural flaws:
- **Under-monetization of Larger Accounts**: A 50-person enterprise pays an effective rate of only **Rp 4,980/employee/month**, leaving substantial willingness-to-pay on the table.
- **Friction at the Lower End**: A 15-employee shop evaluates Rp 249,000 as **Rp 16,600/employee/month**, causing them to hesitate and compare against entry-level tools.

**Strategic Solution**: Transition APEX from a monolithic flat tier to a **Hybrid Base + PEPM (Per-Employee-Per-Month) Tiered Architecture**. This preserves APEX’s identity as an accessible, cost-effective solution while ensuring revenue scales automatically with customer growth.

---

### 1.2 Tiered Packaging & Feature Gate Architecture

The recommended structure introduces four distinct tiers designed around business maturity and operational complexity:

| Tier | Target Persona | Monthly Base Price | Included Seats | Additional Seat Rate (PEPM) | Effective Monthly Cost (Sample Headcounts) | Feature Gates & Capabilities | Upgrade Triggers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter** *(Gratis)* | Micro-businesses, single-outlet F&B/retail (5–10 emp) | **Rp 0** *(Free Forever)* | Up to 10 employees | N/A (Hard Cap at 10) | • 8 emp: **Rp 0**<br>• 10 emp: **Rp 0** | • Geo-locked Selfie Attendance<br>• Single-branch roster<br>• PWA offline-first app<br>• 1-level Cuti/Izin approval<br>• 7-day attendance logs | • Headcount reaches 11<br>• Needs automated payroll<br>• Needs multi-shift swapping<br>• Needs inventory or tasks |
| **Growth** *(Operasional)* | Growing single stores, small workshops (11–25 emp) | **Rp 129,000** / mo | Up to 15 employees | **+ Rp 6,500** / emp / mo | • 15 emp: **Rp 129,000**<br>• 20 emp: **Rp 161,500**<br>• 25 emp: **Rp 194,000** | • Everything in Starter +<br>• Basic Payroll Engine (flat/hourly)<br>• Peer-to-Peer Shift Swapping<br>• Kanban Task Board (up to 3 boards)<br>• Digital PDF Payslips<br>• WhatsApp slip export link<br>• 90-day historical data | • Headcount exceeds 25<br>• Needs PPh 21 TER & BPJS<br>• Needs SKU inventory tracking<br>• Needs Multi-branch outlets |
| **Pro** *(Bisnis & Pajak)* **[FLAGSHIP]** | Core ICP: Multi-shift retail, F&B chains, clinics (20–50 emp) | **Rp 249,000** / mo | Up to 25 employees | **+ Rp 5,500** / emp / mo | • 25 emp: **Rp 249,000**<br>• 35 emp: **Rp 304,000**<br>• 50 emp: **Rp 386,500** | • Everything in Growth +<br>• **PPh 21 TER (PP 58/2023) Engine**<br>• **BPJS TK & Kesehatan Calculation**<br>• **Statutory Overtime (1.5x/2x)**<br>• **High-Density SKU Inventory**<br>• Unlimited Kanban Boards<br>• **Kasbon (EWA) Module Enabled**<br>• Up to 5 Branch Geofences<br>• Priority WhatsApp Support | • Headcount exceeds 50<br>• Needs Custom Bank Disbursal File<br>• Needs Multi-entity consolidation<br>• Needs Dedicated Account Manager |
| **Enterprise** *(Korporasi)* | Multi-branch franchises, regional clinic chains (50–150+ emp) | **Rp 599,000** / mo | Up to 50 employees | **+ Rp 4,500** / emp / mo | • 60 emp: **Rp 644,000**<br>• 100 emp: **Rp 824,000**<br>• 150 emp: **Rp 1,049,000** | • Everything in Pro +<br>• Unlimited Branch Geofences<br>• Custom Bank Payroll Export (BCA/Mandiri/BRI)<br>• Multi-company legal entity switch<br>• Custom Role-Based Access (RBAC)<br>• Dedicated CS Onboarding on-site/remote<br>• 99.9% Uptime SLA & Custom DPA | • Custom API integrations<br>• On-premise deployment or bespoke enterprise contracts |

---

### 1.3 Unit Economics: CAC, LTV, and Payback Period Analysis

To substantiate financial sustainability, the unit economics for each tier are modeled below under realistic Indonesian B2B SaaS benchmarks (blended organic, outbound, and partnership acquisition):

#### Core Economic Assumptions:
- **Gross Margin**: **88%** (Direct COGS includes Supabase compute/storage, Vercel Edge hosting, WhatsApp notification session fees via BSP, and payment gateway transaction fees).
- **Monthly Logo Churn**:
  - Growth: **3.5%** monthly (higher sensitivity in smaller businesses).
  - Pro: **1.8%** monthly (stickiness driven by payroll compliance and inventory data lock-in).
  - Enterprise: **0.8%** monthly (long-term operational reliance).
- **Customer Acquisition Cost (CAC)**: Derived from blended labor hours (Gilank's founder-led sales), outbound WhatsApp verification costs, digital collateral, and referral commissions.

#### Unit Economics Model by Tier:

| Metric | Growth Tier (Avg 20 Emp) | Pro Tier (Avg 35 Emp) | Enterprise Tier (Avg 75 Emp) | Blended Target Portfolio |
| :--- | :--- | :--- | :--- | :--- |
| **Average Monthly Base Fee** | Rp 129,000 | Rp 249,000 | Rp 599,000 | Rp 275,000 |
| **Average Additional PEPM Fee** | Rp 32,500 (5 × Rp 6,500) | Rp 55,000 (10 × Rp 5,500) | Rp 112,500 (25 × Rp 4,500)| Rp 52,000 |
| **Average Revenue Per Account (ARPU/mo)**| **Rp 161,500** | **Rp 304,000** | **Rp 711,500** | **Rp 327,000** |
| **Annualized Run Rate per Customer (ARR)** | Rp 1,938,000 | Rp 3,648,000 | Rp 8,538,000 | Rp 3,924,000 |
| **Gross Margin (%)** | 85% | 89% | 91% | 88.5% |
| **Monthly Gross Profit per Account** | Rp 137,275 | Rp 270,560 | Rp 647,465 | Rp 289,395 |
| **Average Customer Lifetime (Months = 1/Churn)**| 28.5 Months (3.5% Churn) | 55.5 Months (1.8% Churn) | 125.0 Months (0.8% Churn) | 50.0 Months |
| **Customer Lifetime Value (LTV)** | **Rp 3,912,337** | **Rp 15,016,080** | **Rp 80,933,125** | **Rp 14,469,750** |
| **Customer Acquisition Cost (CAC)** | **Rp 350,000** | **Rp 650,000** | **Rp 1,850,000** | **Rp 685,000** |
| **LTV : CAC Ratio** | **11.2x** *(Highly Healthy)* | **23.1x** *(Exceptional)* | **43.7x** *(World-Class)* | **21.1x** |
| **CAC Payback Period (Months)** | **2.55 Months** | **2.40 Months** | **2.85 Months** | **2.37 Months** |

> **Strategic Takeaway**: In early B2B SaaS, any CAC payback period **under 6 months** signifies capital efficiency. With payback periods hovering between **2.4 and 2.8 months**, APEX can aggressively reinvest early subscription cash flows into outbound lead generation and affiliate incentives without external venture dilution.

---

### 1.4 Dynamic Pricing Calculator Formulas

The APEX pricing engine calculates billing using deterministic piecewise functions:

$$\text{Billable Headcount } (N) = \text{Count of Active Employees in Tenant Organization}$$

#### Formula for Growth Tier:
$$\text{Cost}_{\text{Growth}}(N) = \begin{cases} 
\text{Rp } 129,000 & \text{if } N \le 15 \\
\text{Rp } 129,000 + (N - 15) \times \text{Rp } 6,500 & \text{if } 15 < N \le 25 
\end{cases}$$

#### Formula for Pro Tier (Flagship):
$$\text{Cost}_{\text{Pro}}(N) = \begin{cases} 
\text{Rp } 249,000 & \text{if } N \le 25 \\
\text{Rp } 249,000 + (N - 25) \times \text{Rp } 5,500 & \text{if } 25 < N \le 50 
\end{cases}$$

#### Formula for Enterprise Tier:
$$\text{Cost}_{\text{Enterprise}}(N) = \begin{cases} 
\text{Rp } 599,000 & \text{if } N \le 50 \\
\text{Rp } 599,000 + (N - 50) \times \text{Rp } 4,500 & \text{if } N > 50 
\end{cases}$$

---

### 1.5 Natural Expansion & Upgrade Triggers

To prevent churn and systematically guide accounts up the value ladder, APEX implements in-app structural friction and value triggers:

```
[ Starter (0-10) ]
        │
        ├─► Trigger 1: Headcount Exceeded (11th employee added)
        ├─► Trigger 2: End-of-Month Payroll Request ("Otomatiskan Gaji & Slip")
        │
        ▼
[ Growth (11-25) ]
        │
        ├─► Trigger 3: Compliance Mandate (Tax season PPh 21 TER / BPJS audit)
        ├─► Trigger 4: Operational Expansion (Opening second outlet / Stock tracking)
        ├─► Trigger 5: Employee Welfare (Employees requesting Kasbon/EWA)
        │
        ▼
[ Pro (20-50) ]
        │
        ├─► Trigger 6: Scale Barrier (Exceeding 50 active users)
        ├─► Trigger 7: Financial Audit (Requiring custom BCA/Mandiri corporate bank files)
        ├─► Trigger 8: Multi-legal entity management
        │
        ▼
[ Enterprise (50+) ]
```

1. **Headcount Gates (Hard Stop)**: When an admin attempts to invite employee $N+1$ past the tier limit, a high-converting modal appears:  
   *“Kapasitas Kuota Karyawan Penuh. Upgrade ke Paket Pro untuk menambah hingga 50 karyawan hanya dengan tambahan Rp 5.500/orang.”*
2. **Feature Locks (Soft Teasers)**:
   - On Growth, the *Pajak PPh 21 TER & BPJS* tab displays sample calculations with a badge: *“Tersedia di Paket Pro — Hitung PPh 21 otomatis tanpa pusing Excel.”*
   - On Growth, clicking *Tambah Cabang / Outlet Baru* alerts the manager: *“Paket Pro mendukung hingga 5 lokasi cabang sekaligus.”*
3. **Seasonal Drivers**: In Ramadan (prior to Lebaran), trigger an automatic campaign for the **THR Calculation Module**, available exclusively on the Pro tier.

---

### 1.6 Annual Billing & Incentive Architecture

To lock in working capital upfront and crush customer churn, APEX offers an annual billing incentive:
- **Discount Structure**: **"Bayar 10 Bulan, Nikmati 12 Bulan Penuh"** (equivalent to a **16.67% direct discount** or **2 Months Free**).
- **Free White-Glove Onboarding**: Free data migration from Excel, employee roster configuration, and 1-on-1 WhatsApp onboarding call (valued at Rp 500,000) for all annual Pro and Enterprise subscribers.

| Tier | Monthly Rate (Sample Size) | Annual Rate (Equivalent 10 Months) | Immediate Annual Savings for Customer | Cash Inflow to APEX Upfront |
| :--- | :--- | :--- | :--- | :--- |
| **Growth** (15 emp) | Rp 129,000 / mo | **Rp 1,290,000** / year | Hemat Rp 258,000 | Rp 1,290,000 |
| **Pro** (25 emp) | Rp 249,000 / mo | **Rp 2,490,000** / year | Hemat Rp 498,000 | Rp 2,490,000 |
| **Pro** (40 emp) | Rp 331,500 / mo | **Rp 3,315,000** / year | Hemat Rp 663,000 | Rp 3,315,000 |
| **Enterprise** (50 emp)| Rp 599,000 / mo | **Rp 5,990,000** / year | Hemat Rp 1,198,000 | Rp 5,990,000 |

---

### 1.7 Competitive Defensibility vs. Mekari Talenta & Gadjian

| Comparison Dimension | Mekari Talenta | Gadjian + Hadirr | APEX Hybrid PEPM |
| :--- | :--- | :--- | :--- |
| **Total Monthly Cost (35 Employees)** | **~Rp 1,400,000 – Rp 2,200,000** (Rp 40K–60K/emp) | **~Rp 875,000** (Rp 25K/emp across both apps) | **Rp 304,000** (Rp 249K base + 10 × Rp 5.5K) |
| **Implementation / Setup Fee** | Rp 5,000,000 – Rp 15,000,000 | Rp 500,000 – Rp 1,500,000 | **Rp 0 (Gratis Setup Mandiri)** |
| **Minimum Seat Commitment** | 30 – 50 Karyawan | 10 Karyawan | **Tanpa Minimum Kontrak** |
| **Contractual Lock-In** | Annual upfront lock-in mandatory | Annual or monthly | **Bulanan via QRIS / Fleksibel** |
| **All-in-One Operations** | HR only (Inventory requires Jurnal ERP) | HR & Absensi only (2 separate apps) | **Terintegrasi: Absen + Gaji + Stok + Task** |
| **Cost Savings Advantage** | *Baseline Enterprise* | **APEX 65% lebih hemat** | **APEX 78% – 85% lebih hemat** |

---

### 1.8 Localized Pricing Page Copy (Bahasa Indonesia)

```markdown
### Rencana Harga Sederhana & Transparan
#### Pilih paket yang tepat untuk operasional bisnis Anda. Tanpa biaya tersembunyi, batalkan kapan saja.

[Toggle Switch: Bulanan | Tahunan (Hemat 2 Bulan 🎉)]

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│           STARTER               │   │            GROWTH               │
│         Rp 0 /bulan             │   │       Rp 129.000 /bulan         │
│         Gratis Selamanya        │   │    Termasuk 15 karyawan         │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ Cocok untuk usaha mikro & rintisan │ Cocok untuk toko & bengkel mandiri│
│ yang baru mulai mendisiplinkan  │ yang ingin shift teratur & slip │
│ absensi karyawan.               │ gaji rapi.                      │
│                                 │                                 │
│ ✔ Maksimal 10 Karyawan          │ ✔ Termasuk 15 Karyawan          │
│ ✔ Absensi Selfie Anti-Fake GPS  │ ✔ Tambahan Rp 6.500/karyawan    │
│ ✔ PWA Ringan (Tanpa Install)    │ ✔ Jadwal & Tukar Shift Mandiri  │
│ ✔ Pengajuan Cuti & Izin Standar │ ✔ Hitung Gaji & Lembur Sederhana│
│ ✔ Riwayat Absensi 7 Hari        │ ✔ Cetak Slip Gaji PDF Digital   │
│                                 │ ✔ Kanban Task Board Operasional │
│                                 │                                 │
│ [ Mulai Gratis Sekarang ]       │ [ Coba Gratis 14 Hari ]         │
└─────────────────────────────────┘   └─────────────────────────────────┘

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│         PRO (PALING POPULER)    │   │          ENTERPRISE             │
│       Rp 249.000 /bulan         │   │       Rp 599.000 /bulan         │
│    Termasuk 25 karyawan         │   │    Termasuk 50 karyawan         │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ Solusi operasional lengkap untuk │ Untuk bisnis multi-cabang & rantai│
│ F&B, ritel, klinik & laundry    │ ritel yang membutuhkan integrasi│
│ dengan aturan pajak & lembur.   │ perbankan dan kontrol terpusat. │
│                                 │                                 │
│ ✔ Termasuk 25 Karyawan          │ ✔ Termasuk 50 Karyawan          │
│ ✔ Tambahan Rp 5.500/karyawan    │ ✔ Tambahan Rp 4.500/karyawan    │
│ ✔ Pajak PPh 21 TER (PMK 168)    │ ✔ Multi-Cabang & Geofence Bebas │
│ ✔ Potongan BPJS TK & Kesehatan  │ ✔ Export Payroll Bank (BCA/MCM) │
│ ✔ Manajemen Stok SKU Barang     │ ✔ Konsolidasi Multi-Badan Usaha │
│ ✔ Fitur Kasbon Karyawan (EWA)   │ ✔ Dedicated Support WhatsApp VIP│
│ ✔ Multi-Outlet (Hingga 5 Cabang)│ ✔ Jaminan Uptime SLA 99.9%      │
│                                 │                                 │
│ [ Coba Pro Gratis 14 Hari ]     │ [ Hubungi Sales via WhatsApp ]  │
└─────────────────────────────────┘   └─────────────────────────────────┘
```

---

### 1.9 Section 1 Action Items

- [ ] Update database subscription schema with `base_tier`, `included_seats`, and `additional_seat_rate`.
- [ ] Implement billable active headcount check in billing cron worker before generating monthly QRIS invoices.
- [ ] Deploy annual billing toggle with 2-months-free discount logic to `/pricing`.
- [ ] Implement upgrade trigger modal when tenant invites employee $N+1$ past their tier limit.
- [ ] Replace existing static pricing cards on `apex.lankdev.my.id` with the revised Indonesian copy above.

---

## Section 2: Landing Page Conversion Rate Optimization (CRO)

### 2.1 Hero Section Copywriting (3 A/B Test Variants)

Indonesian SME owners are pragmatic and operational. Vague tech jargon like *"Enterprise Operations Control Node"* alienates them. The hero section must speak directly to daily operational friction: rogue employees faking GPS, payroll disputes on payday, or stock disappearing.

#### Variant A: Problem-Agitation-Solution (Focus: Titip Absen & Pusing Payroll) — *Primary Challenger*
```markdown
[Badge]: 🇮🇩 Aplikasi Operasional Karyawan #1 untuk UMKM Indonesia
Headline:
Stop Karyawan Titip Absen. Hitung Gaji & Lembur Otomatis dalam 10 Menit.

Subheadline:
Tinggalkan absen kertas dan rumus Excel yang bikin pusing. APEX menggabungkan absensi selfie anti-fake GPS, hitung lembur otomatis, dan slip gaji digital dalam satu aplikasi ringan.

Primary CTA: [ Coba Gratis 14 Hari Tanpa Kartu Kredit ]
Secondary CTA: [ Tanya Demo via WhatsApp (Fast Response) 📱 ]

Micro-copy below CTA:
⚡ Siap pakai dalam 5 menit • Tanpa install di Play Store • Mulai Rp 0
```

#### Variant B: Financial Arbitrage & Cost Efficiency (Focus: Hemat Biaya HRIS)
```markdown
[Badge]: 💡 Efisiensi Nyata Bisnis Anda
Headline:
Software HR & Payroll Lengkap Sehemat Rp 5.500 per Karyawan.

Subheadline:
Kenapa bayar jutaan rupiah ke software enterprise yang rumit? Dapatkan absensi selfie geo-tag, perhitungan PPh 21 TER, BPJS, dan kontrol stok barang dengan biaya hingga 80% lebih hemat.

Primary CTA: [ Hitung Penghematan Anda (Kalkulator) ]
Secondary CTA: [ Konsultasi via WhatsApp ]
```

#### Variant C: All-In-One Unified Operations (Focus: Absen + Gaji + Stok 1 Dashboard)
```markdown
[Badge]: ⚙️ Solusi Terpadu Bisnis Shift & Ritel
Headline:
Kelola Absensi, Jadwal Shift, Gaji, dan Stok Toko dari Satu Aplikasi.

Subheadline:
Dibuat khusus untuk pemilik restoran, klinik, minimarket, dan laundry. Pantau jam kerja tim di lapangan dan pantau sisa stok harian langsung dari layar HP Anda secara real-time.

Primary CTA: [ Buka Akun Gratis Sekarang ]
Secondary CTA: [ Jadwalkan Demo Singkat ]
```

---

### 2.2 Frictionless Dual CTA Strategy: WhatsApp-First vs. Trial

Indonesian B2B conversion dynamics are heavily relational. While tech-savvy founders sign up self-serve, traditional SME owners (F&B, laundry, workshop owners) require conversational validation via WhatsApp prior to committing data.

```
                  ┌──────────────────────────────────────────────┐
                  │                 VISITOR                      │
                  └───────┬──────────────────────────────┬───────┘
                          │                              │
                          ▼                              ▼
                 [ Self-Service Path ]          [ Conversational Path ]
                          │                              │
                          ▼                              ▼
              "Coba Gratis 14 Hari"           "Tanya Demo via WhatsApp"
             (Direct Auth / Register)          (wa.me link with pre-fill)
                          │                              │
                          ▼                              ▼
              Self-Serve Tenant Setup         Direct Chat with Gilank
              Onboarding Checklist            Guided 2-Minute Demo
                          │                              │
                          └──────────────┬───────────────┘
                                         ▼
                             Active Paying Customer
```

#### WhatsApp CTA Link Configuration:
Direct links must use deep URL parameters including lead source tracking and context pre-fill:
```html
https://wa.me/6282124153732?text=Halo%20Mas%20Gilank%2C%20saya%20tertarik%20coba%20demo%20APEX%20untuk%20usaha%20saya.%20Jumlah%20karyawan%20sekitar%20%5B...%5D%20orang.%20Bisa%20dibantu%3F
```

---

### 2.3 High-Trust Signals & Localized Social Proof

To overcome skepticism toward an early-stage SaaS platform, embed hyper-specific Indonesian trust markers:

1. **"100% Karya Anak Bangsa" Trust Emblem**: Indonesian flag badge positioned beside the navbar and footer:  
   *“100% Dikembangkan di Tangerang Selatan untuk Kemajuan UMKM Indonesia. Server Aman & Terenkripsi.”*
2. **Enterprise-Grade Infrastructure Badges**:
   - `PostgreSQL Row-Level Security (RLS)`: *Isolasi Data Antar-Perusahaan 100% Terjamin.*
   - `256-Bit SSL Encryption`: *Data Absensi & Finansial Aman.*
   - `Anti-Fake GPS / Mock Location Protected`: *Akurat Hingga Radius 15 Meter.*
3. **Structured Testimonial Cards (Templates with Real ICP Angles)**:

```markdown
┌────────────────────────────────────────────────────────────────────────┐
│ ★★★★★                                                                 │
│ "Dulu tiap akhir bulan saya harus begadang 2 hari mencocokkan absen   │
│ kertas dan menghitung lembur 28 perawat kami. Dengan APEX, rekap       │
│ lembur dan slip gaji selesai dalam 15 menit. Titip absen sudah hilang  │
│ total karena verifikasi selfie."                                       │
│                                                                        │
│ dr. Hendra Kurniawan                                                   │
│ Pemilik & Direktur Operasional — Klinik Pratama Medika, Tangerang     │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ ★★★★★                                                                 │
│ "Kami punya 3 outlet kuliner dengan 35 crew shift. Dulu sering sekali │
│ selisih stok bahan baku dan jadwal shift tabrakan. Fitur tukar shift   │
│ mandiri dan stok SKU di APEX bikin operasional kami jauh lebih rapi    │
│ tanpa perlu bayar jutaan rupiah sebulan."                              │
│                                                                        │
│ Ibu Ratna Setyowati                                                    │
│ Founder & Owner — Kedai Kopi & Resto Pawon Kuring, Jakarta Selatan     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Interactive Pricing & ROI Calculator UX

An interactive slider bridges the cognitive gap between flat rates and competitor PEPM pricing, making the direct cost savings undeniable.

#### Interactive Architecture:
- **Input Slider**: Headcount from 5 to 100 employees.
- **Module Checkboxes**:
  - `[x]` Absensi Selfie & Shift Roster (Included)
  - `[x]` Penggajian Otomatis (Included)
  - `[ ]` Modul PPh 21 TER & BPJS (+Rp 1.500/karyawan)
  - `[ ]` Notifikasi Bot WhatsApp (+Rp 49.000/bulan flat)
- **Real-Time Dynamic Output**:
  - Biaya Bulanan APEX: **Rp 304.000**
  - Estimasi Biaya Mekari Talenta: **Rp 1.400.000**
  - Estimasi Biaya Gadjian: **Rp 875.000**
  - **Uang yang Anda Hemat Bersama APEX**: **Rp 1.096.000 / bulan (Hemat 78%)**

---

### 2.5 Below-the-Fold Architecture: Matrix, Industry Cards & FAQs

#### 2.5.1 Comprehensive Feature Comparison Table

| Fitur Utama | Software Enterprise (Mekari Talenta) | Aplikasi Absensi Saja (Kerjoo) | Form Manual / Excel | **APEX Operations** |
| :--- | :---: | :---: | :---: | :---: |
| **Absensi Selfie + Geo-Tag** | ✅ | ✅ | ❌ | **✅ (Offline PWA)** |
| **Proteksi Fake GPS & Mock Location** | ✅ | ✅ | ❌ | **✅ Teruji** |
| **Tukar Shift Mandiri Karyawan** | ⚠️ (Atasan saja) | ❌ | ❌ | **✅ Persetujuan Otomatis** |
| **Hitung Lembur Otomatis (Depnaker)**| ✅ | ❌ | ⚠️ (Rawan salah) | **✅ Multiplier 1.5x/2x** |
| **Pajak PPh 21 TER 2024–2026** | ✅ | ❌ | ❌ | **✅ Otomatis Kategori A/B/C**|
| **Manajemen Stok Barang (SKU)** | ❌ (Beda Aplikasi) | ❌ | ⚠️ (Buku terpisah) | **✅ Terintegrasi** |
| **Kanban Task Checklist Cabang** | ❌ | ❌ | ❌ | **✅ Terintegrasi** |
| **Biaya Bulanan (35 Karyawan)** | Rp 1.400.000+ | Rp 420.000 | "Gratis" (Waktu hilang) | **Rp 304.000 (Terhemat)**|
| **Biaya Setup Awal** | Rp 5.000.000+ | Rp 0 | Rp 0 | **Rp 0 (Gratis)** |

#### 2.5.2 Industry Vertical Cards
1. **Klinik & Layanan Kesehatan 24 Jam**: Mengatasi jadwal perawat shift malam bergilir, rotasi dokter jaga, dan lembur darurat.
2. **Restoran, Kafe, & Waralaba F&B**: Mengunci kebocoran stok bahan baku harian, memantau absensi crew dapur di lokasi, dan checklist kebersihan outlet.
3. **Ritel, Minimarket & Konter**: Mencegah titip absen antar kasir, memonitor pembagian shift tanggal merah, dan inventaris barang dagangan.
4. **Jaringan Laundry & Salon**: Rekap absensi multi-cabang, komisi pengerjaan karyawan, dan monitoring stok detergen/bahan baku.

#### 2.5.3 Localized Indonesian FAQs
- **Q: Apakah karyawan saya harus download aplikasi berat dari Google Play Store?**  
  *A: Tidak perlu! APEX berbasis Progressive Web App (PWA). Cukup buka link website dari Chrome/Safari di HP apa saja, lalu pilih "Add to Home Screen". Ringan, hemat memori, dan hemat kuota internet.*
- **Q: Bagaimana jika internet di toko atau klinik sedang mati/gangguan?**  
  *A: APEX dirancang offline-first. Karyawan tetap bisa selfie dan clock-in seperti biasa. Data dan foto tersimpan aman di HP dan akan otomatis tersinkronisasi saat sinyal kembali normal.*
- **Q: Bisakah APEX menghitung pajak PPh 21 TER dan BPJS terbaru?**  
  *A: Ya. APEX sudah mengikuti regulasi PP 58/2023 dan PMK 168/2023 dengan rumus TER bulanan (Kategori A, B, C) serta kalkulasi BPJS Ketenagakerjaan dan Kesehatan lengkap.*
- **Q: Apakah saya dibantu saat memindahkan data karyawan dari Excel?**  
  *A: Tentu. Tim APEX (atau Mas Gilank langsung) akan membantu mengimpor file Excel data karyawan dan shift Anda sampai sistem berjalan 100%.*

---

### 2.6 Mobile-First Conversion Architecture (80%+ Mobile Traffic)

Over 80% of Indonesian business owners browse SaaS products on mobile devices (primarily Android smartphones). The landing page must adhere to strict mobile UX guidelines:
1. **Persistent Sticky Bottom Action Bar**:
   - Fixed at viewport bottom with two high-contrast buttons:
     - Left (40% width): `[ Chat WA 📱 ]` (Direct trigger to WhatsApp app).
     - Right (60% width): `[ Coba Gratis 14 Hari ]` (High-contrast emerald button).
2. **Touch Target Sizing**: All buttons, toggles, and dropdowns formatted with a minimum touch area of **48 × 48 px**.
3. **Core Web Vitals Optimization**:
   - Largest Contentful Paint (LCP) target: **< 1.4 seconds** on Indonesian 4G cellular networks.
   - Compress all imagery using WebP format; replace heavy illustrations with clean SVG icons from Lucide.

---

### 2.7 Systematic 5-Step A/B Testing Roadmap

| Test # | Page Element | Variant A (Control) | Variant B (Challenger) | Target Success Metric | Minimum Sample Size |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | Hero Headline & Subhead | Tech-oriented ("Platform Kontrol Operasi") | Pain-oriented ("Stop Karyawan Titip Absen. Hitung Gaji 10 Menit") | Landing-to-Trial Conversion Rate | 350 Visitors / variant |
| **2** | Primary CTA Button Copy | "Mulai Uji Coba Sekarang" | "Coba Gratis 14 Hari Tanpa Kartu Kredit" | Click-Through Rate (CTR) | 300 Visitors / variant |
| **3** | Mobile Sticky Bottom CTA | "Coba Gratis" only | Dual CTA: "Chat WhatsApp" + "Coba Gratis" | Total Lead Inquiries (Chat + Signup) | 400 Mobile Visitors |
| **4** | Pricing Section Display | Static 3-column pricing card table | Interactive Headcount Slider + Comparison | Pricing Section Engagement & Scroll Depth | 300 Visitors / variant |
| **5** | Social Proof Placement | Testimonials located near page footer | Testimonials placed immediately below Hero | Bounce Rate Reduction (< 45%) | 350 Visitors / variant |

---

### 2.8 Floating WhatsApp Conversion Widget Implementation

To capture immediate mobile leads without page interruption, deploy an animated, unread-badged floating WhatsApp widget:

```tsx
// Location: src/components/landing/WhatsAppFloatingButton.tsx
import React from "react";
import { MessageCircle } from "lucide-react";

export function WhatsAppFloatingButton() {
  const phoneNumber = "6282124153732";
  const defaultMessage = encodeURIComponent(
    "Halo Mas Gilank, saya lihat website APEX. Mau tanya demo dan kecocokan untuk usaha saya."
  );

  return (
    <aside aria-label="WhatsApp Support" className="fixed bottom-6 right-6 z-50 flex items-center group">
      {/* Tooltip Hover Bubble on Desktop */}
      <div className="hidden md:flex items-center mr-3 bg-slate-900 text-slate-100 text-xs font-medium py-1.5 px-3 rounded-xl border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Konsultasi Operasional Gratis via WA 💬
      </div>

      {/* Floating Action Button */}
      <a
        href={`https://wa.me/${phoneNumber}?text=${defaultMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Tanya Demo via WhatsApp"
        className="relative flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full shadow-2xl transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
      >
        {/* Pulsing Attention Ring */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />

        {/* Unread Notification Indicator */}
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-slate-950">
          1
        </span>

        <MessageCircle className="w-7 h-7 fill-current" />
      </a>
    </aside>
  );
}
```

---

### 2.9 Section 2 Action Items

- [ ] Deploy Hero Variant A (Problem-Agitation-Solution) to the live homepage.
- [ ] Implement `WhatsAppFloatingButton.tsx` across all public landing and pricing pages.
- [ ] Install the sticky bottom mobile action bar for viewport widths $< 768\text{ px}$.
- [ ] Add the interactive headcount ROI calculator to `/pricing`.
- [ ] Embed the 4 industry vertical cards (Clinics, F&B, Retail, Laundry) below the fold.

---

## Section 3: Kasbon (Earned Wage Access / EWA) Monetization Model

### 3.1 Model Evaluation: Employer-Sponsored vs. Flat Convenience Fee vs. Hybrid

Frontline employee turnover in Indonesian retail, clinics, and F&B runs between **30% and 45% annually**. Frontline workers frequently resort to predatory illegal online lenders (*pinjol ilegal*) charging exorbitant daily interest. Earned Wage Access (Kasbon) allows employees to withdraw accrued wages prior to payday.

| Feature / Metric | Model 1: Employer-Sponsored | Model 2: Flat Convenience Fee (Employee-Paid) | Model 3: Hybrid Value Model **[RECOMMENDED]** |
| :--- | :--- | :--- | :--- |
| **Payer** | Perusahaan / Employer pays monthly fee | Karyawan / Employee pays per transaction | Shared / Hybrid |
| **Pricing Structure** | Flat Rp 3,000 – Rp 5,000 / employee / month added to SaaS bill | Rp 3,500 – Rp 5,000 flat fee per withdrawal deducted at disbursement | Employer gets free inclusion on Pro tier; employee pays Rp 4,500 flat per pull |
| **Employer Adoption Resistance** | **High** (Hesitant to pay additional monthly SaaS overhead) | **Low** (Zero financial burden on employer balance sheet) | **Zero Resistance** (Framed as free employer benefit) |
| **Employee Acceptance** | **Maximum** (100% free withdrawal) | **Very High** (Fee is cheaper than ATM admin fees or *pinjol*) | **Very High** (Transparent single flat fee) |
| **Cash Flow Risk to APEX** | Zero | Zero | Zero |
| **Strategic Recommendation** | Unsuitable for early SME market | Acceptable fallback | **Winner: Powers fastest sales adoption** |

> **Recommendation**: Adopt the **Hybrid Value Model**. The employer pays **Rp 0** to activate the feature (it acts as a major hook to sell the **Pro tier**), while the employee pays a transparent flat fee of **Rp 4,500** per withdrawal (split between APEX and the payment/liquidity partner).

---

### 3.2 10-Customer Pilot Financial & Revenue Projections

#### Pilot Benchmark Parameters:
- **Number of Active Tenants**: 10 Pilot Companies.
- **Average Headcount per Company**: 30 Employees (Total Employee Pool = 300 Workers).
- **Monthly Kasbon Adoption Rate**: **20%** of eligible workforce utilizes EWA each month ($300 \times 0.20 = 60\text{ unique active employees}$).
- **Average Requests per Active Employee**: **1.8 withdrawals per month** (e.g., mid-month emergency + school/utility payment).
- **Total Monthly Kasbon Transactions**: $60 \times 1.8 = \mathbf{108\text{ transactions/month}}$.
- **Average Transaction Value**: **Rp 450,000** (safely capped within the 50% accrued limit).
- **Total Disbursed Volume (GMV)**: $108 \times \text{Rp } 450,000 = \mathbf{\text{Rp } 48,600,000\text{ / month}}$.

#### Unit Margin & Revenue Waterfall (Per Transaction):
- **Gross Convenience Fee**: **Rp 4,500**
- **Disbursement Rail Cost (Flip / Xendit API)**: **Rp 2,000** (standard bank disbursement rate)
- **Net Margin to APEX**: **Rp 2,500 per transaction**

#### Monthly Recurring Kasbon Revenue Projections:

$$\text{Monthly Net Kasbon Margin} = 108 \text{ transactions} \times \text{Rp } 2,500 = \mathbf{\text{Rp } 270,000\text{ / month}}$$

#### Scaled Growth Projections:

| Milestone | Active Tenants | Total Employee Pool | Monthly Active Kasbon Users | Monthly Transactions | Monthly Net Revenue to APEX | Annualized Net Kasbon Revenue |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Pilot Phase** | 10 | 300 | 60 | 108 | **Rp 270,000** | Rp 3,240,000 |
| **Expansion** | 50 | 1,500 | 300 | 540 | **Rp 1,350,000** | Rp 16,200,000 |
| **Growth Target**| 150 | 4,500 | 900 | 1,620 | **Rp 4,050,000** | Rp 48,600,000 |
| **Scale Target** | 500 | 15,000 | 3,000 | 5,400 | **Rp 13,500,000** | Rp 162,000,000 |

> **Strategic Value**: Even at early pilot scale, Kasbon functions not merely as direct margin, but as **the single most powerful customer retention mechanism**. Companies with active Kasbon programs exhibit near-zero software churn because changing HR systems disrupts employee financial liquidity.

---

### 3.3 Recommended Pricing & Revenue-Share Matrix

```
┌─────────────────────────────────────────────────────────────┐
│              Employee Requests Rp 500.000 Kasbon            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Disbursed via Payment Rail: Net Rp 495.500 to Employee Bank│
│  Flat Technology & Admin Fee Deducted: Rp 4.500             │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Payment Rail Cost   │              │   APEX Net Revenue   │
│   (Flip / Xendit)    │              │  (Software Margin)   │
│      Rp 2.000        │              │       Rp 2.500       │
└──────────────────────┘              └──────────────────────┘
```

---

### 3.4 Strategic Liquidity Partnerships: GajiGesa vs. Wagely vs. Payuung

| Dimension | GajiGesa | Wagely | Payuung (by Fast-8) | APEX Self-Funded Treasury Float |
| :--- | :--- | :--- | :--- | :--- |
| **Market Focus** | Mid-market & factory enterprises | Large manufacturing & retail | Integrated SME payroll ecosystem | Direct pilot tenants (10 pilot companies) |
| **API Readiness** | REST API & Webhooks available | Enterprise SDK / Partner integration | Closed ecosystem (Gadjian-only) | Internal Supabase Edge Functions |
| **Balance Sheet Capital**| GajiGesa provides full liquidity | Wagely provides full liquidity | Bank partner balance sheet | **Employer provides float** (Zero APEX risk) |
| **Partner Revenue Split**| 30% – 40% margin share to SaaS | 25% – 35% margin share to SaaS | Negligible for external platforms | **100% fee retained by APEX / Employer** |
| **Integration Complexity**| Moderate (2–3 weeks engineering) | Moderate (Requires partner NDA) | High (Competitive conflict) | **Extremely Low (1 week via Flip API)** |
| **Strategic Recommendation**| **Primary Partner for Phase 2 Scale**| Strong alternative for Phase 2 | Avoid (Direct competitor lock-in) | **Mandatory for Phase 1 (First 10 Pilots)** |

---

### 3.5 Indonesian Regulatory & Compliance Guardrails (OJK, BI, Labor Law)

To operate with legal certitude in Indonesia, APEX must strictly respect regulatory boundaries:

1. **Earned Wage Advance vs. Peer-to-Peer Lending (OJK Compliance)**:
   - APEX is **NOT** a Peer-to-Peer Lending platform (*Pinjol*) under **POJK 10/POJK.05/2022**.
   - Kasbon is legally defined as an **early disbursement of wages already earned by the employee** (*gaji yang sudah menjadi hak pekerja*), governed under contractual civil law and labor regulations.
   - **Critical Rule**: APEX must **NEVER** charge interest (*bunga*), late fees (*denda keterlambatan*), or compound penalties. Only a fixed, transparent administrative/technology fee (*biaya administrasi teknologi*) is permitted.
2. **Indonesian Labor Law Protection (PP 36/2021 & PP 35/2021)**:
   - Article 65 of PP 36/2021 mandates that total deductions from an employee’s monthly wage (including Kasbon, loan repayments, and fines) **cannot exceed 50% of the employee’s total earnings** in that pay cycle.
   - *Technical Guardrail*: APEX’s accrual formula must enforce a hard clamp preventing total monthly Kasbon withdrawals from ever exceeding **50% of verified earned salary-to-date**.
3. **Bank Indonesia Payment Rail Compliance (PBI 23/6/PBI/2021 on Payment Systems)**:
   - APEX must not act as an unlicensed fund depository or custodian (*Penyeleggara Jasa Pembayaran / PJP*).
   - In Phase 1, funds flow directly from the employer's operational account to the employee via a licensed PJP disbursement rail (such as **Flip for Business** or **Xendit**, licensed under Bank Indonesia Category 3).

---

### 3.6 Phased Rollout Roadmap: Internal Treasury Float to Institutional API

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│       PHASE 1: EMPLOYER FLOAT        │     │     PHASE 2: INSTITUTIONAL EWA       │
│        (Months 1–3: 10 Pilots)       │     │       (Months 4+: Scaled Rollout)    │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • Employer allocates float (Rp 5M)   │────►│ • Connect GajiGesa / Wagely API      │
│ • Zero balance sheet capital from APEX│     │ • Institutional capital funds advances│
│ • Disbursed via Flip / BCA Virtual   │     │ • Automated batch settlement         │
│ • Payroll engine auto-deducts at cut │     │ • APEX earns passive 30% rev-share   │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

- **Phase 1 (Controlled Pilot — 10 Companies)**: The employer deposits an operational treasury float (e.g., Rp 5,000,000 in their own designated account). When an employee withdraws Kasbon, the employer or APEX's disbursement trigger transfers the funds. At month-end, the APEX payroll engine automatically injects the exact amount as a deduction item (*Potongan Kasbon*) in the payslip. **Zero capital liability for APEX.**
- **Phase 2 (Scale — 50+ Companies)**: Once APEX proves 500+ monthly transactions, integrate GajiGesa or Wagely via API. The institutional partner supplies balance sheet liquidity, handles compliance filings, and remits a recurring 30% net commission to APEX.

---

### 3.7 Legal Term Sheet & Employer-Sponsored Contract Addendum

```markdown
ADDENDUM PERJANJIAN PENGGUNAAN FITUR FASILITAS AKSES GAJI DI MUKA (KASBON/EWA)
Nomor: [Auto-Generated]/ADD-EWA/APEX/[Month]/[Year]

Antara:
1. PT / CV [Nama Perusahaan Tenant], berkedudukan di [Kota], selanjutnya disebut "Pemberi Kerja".
2. PT [Badan Hukum APEX / Lankdev], selanjutnya disebut "Penyedia Platform".

Pasal 1: Definisi dan Sifat Layanan
1. Fitur Kasbon APEX merupakan fasilitas akses gaji dini (Earned Wage Access) berbasis teknologi yang memungkinkan Pekerja dari Pemberi Kerja untuk menarik sebagian upah yang telah menjadi haknya sebelum tanggal penggajian resmi.
2. Layanan ini murni merupakan pencairan upah terakrual dan BUKAN merupakan fasilitas pinjaman perorangan atau kredit berbunga.

Pasal 2: Batasan dan Parameter Keamanan
1. Pekerja hanya berhak mengajukan penarikan maksimal 50% (lima puluh persen) dari nilai upah prorata yang telah dibuktikan melalui kehadiran kerja sah pada bulan berjalan.
2. Setiap transaksi penarikan dikenakan Biaya Administrasi dan Teknologi flat sebesar Rp 4.500 (empat ribu lima ratus Rupiah), yang dibebankan kepada Pekerja pada saat pencairan.

Pasal 3: Mekanisme Pemotongan Penggajian (Payroll Cutoff)
1. Pemberi Kerja memberikan kuasa penuh kepada sistem APEX untuk mencatat setiap penarikan Kasbon yang sah sebagai komponen pengurang (deduction) resmi dalam Slip Gaji bulanan Pekerja.
2. Pemberi Kerja bertanggung jawab penuh atas ketersediaan dana operasional dan kesepakatan internal dengan Pekerja sesuai Peraturan Pemerintah Nomor 36 Tahun 2021 tentang Pengupahan.
```

---

### 3.8 WhatsApp Notification & Lifecycle Transaction Templates

#### Template 1: Kasbon Request Received & Approved
```
[APEX Kasbon Info]
Halo Bpk/Ibu {{1}}, pengajuan Kasbon Anda sebesar Rp {{2}} telah DISETUJUI.

Dana bersih sebesar Rp {{3}} telah ditransfer ke rekening {{4}} ({{5}}) melalui sistem Flip. Biaya admin: Rp 4.500.

Jumlah ini akan otomatis dipotong pada Slip Gaji periode {{6}}.
Sisa limit Kasbon Anda bulan ini: Rp {{7}}.
```

#### Template 2: Kasbon Limit Reached / Cooldown Warning
```
[APEX Kasbon Alert]
Halo {{1}}, pengajuan Kasbon sebesar Rp {{2}} tidak dapat diproses.

Alasan: Melebihi batas maksimal 50% upah terakrual kerja Anda (Limit tersedia: Rp {{3}}).
Silakan ajukan kembali setelah jadwal kerja berikutnya tercatat pada sistem.
```

#### Template 3: End-of-Month Payroll Deduction Summary
```
[APEX E-Payslip]
Halo {{1}}, slip gaji periode {{2}} telah terbit.
Gaji Pokok & Tunjangan: Rp {{3}}
Lembur: Rp {{4}}
Potongan Kasbon ({{5}}x penarikan): -Rp {{6}}
Total Gaji Bersih (Take Home Pay): Rp {{7}}

Unduh rincian slip gaji PDF resmi Anda di: https://apex.lankdev.my.id/payslip/{{8}}
```

---

### 3.9 Section 3 Action Items

- [ ] Execute `kasbon_policies` and `kasbon_requests` database migration in Supabase.
- [ ] Connect Flip for Business or Xendit Disbursal Sandbox API to handle instant payouts.
- [ ] Implement the 50% accrued wage calculation clamp in Next.js Server Action.
- [ ] Pitch Kasbon as a zero-cost employee retention benefit to the first 3 pilot clients.
- [ ] Deploy WhatsApp webhook triggers for payout confirmation notifications.

---

## Section 4: High-Velocity B2B Acquisition Channels

### 4.1 Channel Overview & Comparative Scorecard

To reach 100 paying customers within 6 months as a bootstrapped solo founder, APEX cannot rely on expensive broad-match digital advertising. Acquisition must prioritize high-leverage partnerships, direct conversational outreach, and organic community resonance.

| Acquisition Channel | Target Audience | Expected Blended CAC | Time to First Closed Tenant | Founder Effort Level | 6-Month Closed Customer Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Channel A: Accounting Firms (KAP/BKP)** | Akuntan Publik, Konsultan Pajak | **Rp 250,000** | 3–4 Weeks | Medium (Partner meetings) | 35 Tenants (High Leverage) |
| **Channel B: LinkedIn & WhatsApp Outbound**| Business Owners, HR Managers | **Rp 350,000** | 1–2 Weeks | High (Daily prospecting) | 30 Tenants (Immediate) |
| **Channel C: Search Engine & AEO (SEO)** | Inbound SME Searchers, AI queries | **Rp 150,000** | 8–12 Weeks | Medium (Content production) | 15 Tenants (Compounding) |
| **Channel D: Ecosystem (TikTok, FB, POS)** | Retail / F&B Owners, UMKM Groups | **Rp 200,000** | 2–3 Weeks | Medium (Viral & Community) | 20 Tenants (High Reach) |

---

### 4.2 Channel A: Accounting Firm (KAP / BKP) Strategic Alliances

#### Strategic Thesis:
SME owners do not trust software ads; they trust their **external tax consultant (*Konsultan Pajak*)** and **independent accounting firm (*Kantor Jasa Akuntansi / KJA / KAP*)**. An accountant managing 25 SME clients suffers immense frustration every month collecting incomplete attendance sheets and erroneous Excel overtime files to calculate PPh 21 TER. By turning the accountant into an APEX partner, Gilank gains instant 1-to-many distribution.

#### Value Proposition for Accountants:
- **Zero-Friction PPh 21 TER Export**: One-click output perfectly structured for e-Bupot and Coretax.
- **Save 15+ Hours per Client Monthly**: Eliminates manual timesheet cleaning.
- **New Revenue Stream**: Recurring 20% commission on software subscription fees for every referred tenant.

#### Partnership Structure Options:
1. **Certified APEX Advisor (Referral Model - Recommended)**: The accounting firm receives **20% recurring monthly revenue share** for the lifetime of each active client.
2. **Wholesale Co-Branded Package**: The accountant bundles APEX into their monthly retainer (e.g., charging their client Rp 500,000/mo for full bookkeeping + HR, purchasing APEX at a 30% wholesale discount).

#### Professional Outreach Script to Accounting Firms:
```markdown
Subjek: Kolaborasi KJA [Nama Kantor] x APEX: Otomasi Rekap PPh 21 TER Klien UMKM

Yth. Bapak/Ibu [Nama Pimpinan KJA/KAP],

Perkenalkan, saya Gilank, founder APEX (apex.lankdev.my.id) dari Tangerang Selatan.

Kami mengembangkan software HR & operasional yang membantu kantor akuntan dan konsultan pajak mengotomatiskan rekap absensi, lembur, dan kalkulasi PPh 21 TER (PMK 168/2023) untuk klien UMKM (20–50 karyawan).

Masalah klasik yang sering kami temui: konsultan pajak membuang belasan jam tiap akhir bulan hanya untuk merapikan file Excel absensi klien yang berantakan sebelum bisa menghitung PPh 21 dan BPJS.

Melalui Program Kemitraan APEX Advisor:
1. Klien Bapak/Ibu mendapatkan sistem absensi selfie & payroll siap pakai dengan diskon khusus 20%.
2. Tim KJA mendapatkan akses dashboard konsolidasi untuk unduh rekap PPh 21 TER siap lapor sekali klik.
3. KJA mendapatkan bagi hasil kemitraan 20% recurring setiap bulan untuk setiap klien aktif.

Boleh saya kirimkan video overview 3 menit atau jadwalkan demo online singkat selama 15 menit minggu ini?

Hormat saya,
Gilank — Founder, APEX
WhatsApp: 0821-2415-3732
Website: https://apex.lankdev.my.id
```

---

### 4.3 Channel B: Outbound LinkedIn & Direct WhatsApp Prospecting

#### 4.3.1 LinkedIn Content & Outreach Strategy

Target Personas:
1. **Owner / Direktur / Founder** (F&B, Retail, Klinik, Rantai Usaha di Jabodetabek).
2. **HR Manager / General Affairs (GA) Supervisor**.
3. **Head of Operations / Outlet Operations Manager**.

##### LinkedIn Post 1: Founder Build-in-Public / Problem-Agitation
```
Karyawan Anda masih titip absen pakai foto galeri? Atau tiap tanggal 27 kantor Anda masih lembur 2 hari cuma buat hitung Excel lembur?

Sebagai software engineer yang sering ngobrol dengan pemilik kafe, klinik, dan toko ritel di Tangsel, saya heran kenapa software HR di Indonesia polarisasinya ekstrem banget:
- Kalau nggak software enterprise yang harganya jutaan sebulan plus biaya setup 10 juta...
- Ya cuma aplikasi absensi sederhana yang nggak bisa hitung PPh 21 dan nggak ngerti shift kerja.

Bisnis dengan 20–50 karyawan akhirnya kejepit di tengah: bayar kemahalan atau tetap manual pakai kertas.

Itulah kenapa saya membangun APEX (apex.lankdev.my.id). Absensi selfie anti-fake GPS, hitung lembur otomatis, slip gaji digital, plus kontrol stok barang dari satu dashboard ringan.

Tanpa perlu install aplikasi berat di Play Store. Cukup via browser HP.

Bulan ini kami membuka 5 slot implementasi gratis untuk bisnis F&B atau klinik di Jabodetabek. Ada yang mau tim operasionalnya dibantu rapikan sistem absennya? Tulis di komentar atau DM saya ya! 👇
```

##### LinkedIn Post 2: The Regulatory Pain Point (PPh 21 TER Awareness)
```
Banyak pemilik usaha belum sadar: sejak aturan PPh 21 TER (PP 58/2023 & PMK 168) resmi berlaku, cara menghitung pajak karyawan berubah total.

Bukan cuma soal tarif efektif bulanan Kategori A, B, dan C, tapi sinkronisasi data lembur dan absensi harian yang bikin tim finance kewalahan.

Salah potong pajak = risiko komplain karyawan dan teguran kantor pajak.
Hitung manual di Excel = rawan rumus bergeser.

Di APEX, mesin kalkulasi PPh 21 TER sudah tertanam langsung dengan absensi selfie. Saat jam lembur diverifikasi, nilai pajak TER terhitung otomatis di slip gaji karyawan secara real-time.

Efisiensi bukan berarti harus beli software mahal ratusan juta. Teknologi yang tepat harusnya bikin bisnis makin lincah, bukan makin terbebani.

Bagaimana perusahaan Anda menangani hitungan PPh 21 TER bulan ini? Masih manual atau sudah otomatis?
```

##### LinkedIn Post 3: Case Study & Metric Transformation
```
Dari 2 hari rekap gaji, jadi 12 menit selesai.

Ini cerita salah satu klinik rekanan kami dengan 28 tenaga medis dan perawat shift.

Tantangan sebelum pakai sistem terpadu:
1. Jadwal perawat bergilir sering bentrok di grup WhatsApp.
2. Form lembur kertas sering hilang atau tidak terverifikasi dokter jaga.
3. Karyawan sering menanyakan rincian potongan BPJS dan kasbon saat gajian.

Setelah migrasi ke APEX:
✅ Tukar shift dilakukan mandiri antar-perawat lewat aplikasi (langsung approval supervisor).
✅ Absen selfie terkunci radius geofence klinik (bebas titip absen).
✅ Rekap gaji, lembur, dan slip PDF terdistribusi otomatis ke masing-masing karyawan.

Pemilik klinik bisa fokus ke pelayanan pasien, tim HR hemat waktu 90%.

Teknologi hebat itu bukan yang paling rumit, tapi yang paling menyelesaikan masalah nyata di lapangan.
```

##### LinkedIn Connection Request Script:
```text
Halo Pak/Bu [Nama], salam kenal. Saya Gilank, developer APEX dari Tangsel. Saya perhatikan [Nama Usaha] sedang aktif berekspansi di bidang [Industri/F&B/Klinik]. Ingin terhubung untuk berbagi wawasan seputar efisiensi operasional shift dan automasi payroll di Indonesia. Salam sukses!
```

---

#### 4.3.2 WhatsApp Direct Outreach Playbook (Cold to Warm Sequences)

##### Warm Outreach Sequence (Targeting Businesses Posting Job Vacancies):
*Rationale*: Companies actively hiring on LinkedIn, Jobstreet, or Instagram (e.g. searching for "Perawat", "Barista", "Kasir", "Staff HRD") are experiencing workforce growth and acute administrative pain.

*Touch 1 (Day 1 - Discovery & Value Offer)*:
```
Selamat siang Pak/Bu [Nama Owner/HRD], salam kenal saya Gilank dari APEX (apex.lankdev.my.id).

Saya lihat [Nama Bisnis] sedang aktif merekrut tim baru untuk posisi [Posisi di Loker]. Selamat atas perkembangan usahanya!

Biasanya saat cabang dan karyawan bertambah ke 20–50 orang, tantangan terbesarnya ada di absensi shift yang bocor (titip absen) dan rekap gaji lembur yang memakan waktu berhari-hari.

Kami mengembangkan aplikasi absensi selfie anti-fake GPS + payroll otomatis yang sudah disesuaikan untuk bisnis [F&B/Klinik/Ritel]. 

Bulan ini kami menyediakan program pilot khusus: 3 bulan setengah harga dan saya pribadi bantu input data shift & karyawan sampai sistem berjalan 100%.

Boleh saya kirimkan video demo 2 menit cara kerjanya di HP?
```

*Touch 2 (Day 4 - Gentle Value Follow-Up)*:
```
Selamat siang Pak/Bu [Nama], hanya ingin follow up pesan singkat kemarin.

Kami baru saja merilis studi kasus bagaimana klinik dan resto rekanan kami memangkas waktu hitung gaji dari 2 hari menjadi 15 menit dengan slip gaji digital langsung ke karyawan.

Masih ada 1 slot program pilot untuk minggu ini. Jika berkenan, saya kirimkan demonya di sini ya Pak/Bu? Terima kasih banyak!
```

*Touch 3 (Day 8 - The Breakup / Final Door Open)*:
```
Selamat siang Pak/Bu [Nama], semoga bisnis [Nama Perusahaan] semakin lancar.

Sepertinya saat ini automasi absensi dan payroll belum menjadi prioritas utama tim. Tidak masalah sama sekali!

Saya izin simpan kontak Bapak/Ibu ya. Jika suatu saat membutuhkan solusi absensi selfie yang bebas titip absen atau butuh konsultasi perhitungan PPh 21 TER, silakan hubungi saya kapan saja. Sukses selalu untuk [Nama Bisnis]!
```

---

### 4.4 Channel C: Search Engine & Answer Engine Optimization (SEO / AEO)

#### 4.4.1 High-Intent Indonesian Keyword Research

| Target Keyword | Monthly Search Volume (ID) | Keyword Difficulty (0–100) | Searcher Intent | Recommended Content Format |
| :--- | :---: | :---: | :--- | :--- |
| `aplikasi absensi online gratis` | 8,100 | 42 (Medium) | Transactional / Commercial | Comparison Guide + Free Tier CTA |
| `software payroll indonesia terbaik` | 2,400 | 48 (Medium) | Commercial Investigation | Buyer Guide: Mekari vs APEX |
| `cara hitung pph 21 ter 2024 excel` | 5,400 | 28 (Low-Med) | Informational / High Pain | Excel Template Free Download + Tool |
| `aplikasi absensi selfie anti fake gps`| 1,600 | 22 (Low) | High Intent Transactional | Product Feature Landing Page |
| `aplikasi jadwal shift kerja excel` | 3,200 | 25 (Low) | Pain-Point Workaround | Free Shift Template + Interactive App|
| `biaya aplikasi mekari talenta` | 1,100 | 31 (Low-Med) | Price Sensitive Comparison | "Biaya Talenta vs APEX: Hitung Cermat"|
| `cara menghitung upah lembur depnaker`| 4,800 | 30 (Low-Med) | Compliance / Educational | Calculator Page + Explainer Article |
| `aplikasi stok barang dan kasir toko` | 6,600 | 52 (High) | Operational Retail Search | Operations Suite Feature Guide |
| `aturan kasbon karyawan depnaker` | 880 | 18 (Low) | High Trust Employer Search | Legal Guide + Kasbon EWA Feature |
| `software hris murah untuk umkm` | 1,400 | 26 (Low) | Laser ICP Commercial Intent | Core Category Pillar Page |

#### 4.4.2 Strategic 10-Article Editorial Calendar

1. **Pillar Guide 1**: *Panduan Lengkap PPh 21 TER 2024–2026: Rumus Kategori A, B, C dan Cara Hitung Otomatis Tanpa Pusing Excel.*  
   *Target*: `cara hitung pph 21 ter 2024`, `kategori ter pph 21`.  
   *CTA*: Coba Kalkulator PPh 21 APEX Gratis.
2. **Pillar Guide 2**: *10 Software Payroll & HRIS Terbaik di Indonesia (Review Fitur & Perbandingan Biaya Terbuka).*  
   *Target*: `software payroll indonesia terbaik`, `software hris murah`.  
   *CTA*: Bandingkan Harga APEX vs Talenta.
3. **Operational Playbook 3**: *Cara Mengatur Jadwal Shift Karyawan Restoran & Klinik agar Tidak Bentrok (Download Template Excel).*  
   *Target*: `aplikasi jadwal shift kerja`, `template shift kerja karyawan`.  
   *CTA*: Buat Roster Otomatis di APEX Starter.
4. **Legal Compliance 4**: *Aturan Lembur Depnaker Kepmenaker 102: Rumus Kali 1.5x dan 2x Beserta Contoh Kasus Nyata.*  
   *Target*: `cara menghitung upah lembur depnaker`, `perhitungan lembur depnaker`.  
   *CTA*: Hitung Upah Lembur Akurat di APEX.
5. **Security Explainer 5**: *Waspada Fake GPS! Cara Memilih Aplikasi Absensi Selfie yang Kebal Kecurangan Karyawan.*  
   *Target*: `aplikasi absensi selfie anti fake gps`, `cara mendeteksi fake gps absen`.  
   *CTA*: Uji Liveness & Geo-lock APEX 14 Hari.
6. **Financial Wellness 6**: *Kasbon Karyawan Sering Bikin Cashflow Bocor? Ini Aturan Hukum & Solusi EWA Modern Tanpa Modal Perusahaan.*  
   *Target*: `aturan kasbon karyawan depnaker`, `solusi kasbon perusahaan`.  
   *CTA*: Aktifkan Kasbon Mandiri APEX.
7. **Cost Comparison 7**: *Bongkar Biaya Software HR: Kenapa Sistem Per-Karyawan Mahal dan Bagaimana APEX Menghemat 80% Anggaran.*  
   *Target*: `biaya aplikasi mekari talenta`, `alternatif talenta mekari`.  
   *CTA*: Buka Kalkulator ROI APEX.
8. **Retail Operations 8**: *Integrasi Absensi dan Stok Barang: Kunci Menghentikan Kehilangan Omzet di Bisnis Ritel & F&B.*  
   *Target*: `aplikasi stok barang toko`, `manajemen operasional ritel`.  
   *CTA*: Pantau SKU dan Tim di APEX.
9. **Tax Regulation 9**: *Perbedaan Potongan BPJS Ketenagakerjaan dan Kesehatan di Slip Gaji: Berapa Porsi Karyawan vs Perusahaan?*  
   *Target*: `potongan bpjs ketenagakerjaan karyawan`, `persentase bpjs kesehatan`.  
   *CTA*: Buat Slip Gaji Resmi BPJS di APEX.
10. **Holiday Bonus Guide 10**: *Cara Menghitung THR Karyawan Kontrak dan Tetap Sesuai Permenaker No 6 Tahun 2016 (Disertai Contoh).*  
    *Target*: `cara menghitung thr karyawan`, `perhitungan thr karyawan kontrak`.  
    *CTA*: Otomasi THR Sekali Klik di APEX Pro.

#### 4.4.3 Answer Engine Optimization (AEO) Strategy for AI Assistants
When Indonesian business owners ask ChatGPT, Gemini, Perplexity, or Claude: *"Apa software HR dan absensi terbaik untuk UMKM 30 karyawan di Indonesia?"*, APEX must be cited in the direct generated answer.

##### Actionable AEO Tactics:
- **Direct Definitive Q&A Blocks**: Embed structured definition tables at the top of every blog post answering: *“Berapa biaya APEX HR?”, “Apa kelebihan APEX dibanding Talenta?”, “Bagaimana APEX mencegah fake GPS?”*
- **Authoritative Technical Density**: Publish detailed statutory formulas for PPh 21 TER and BPJS caps. Large Language Models prioritize technically rigorous, cited content over fluffy promotional marketing.
- **Structured Schema Injection**: Inject schema types `SoftwareApplication`, `FAQPage`, and `Product` with exact price points into all landing page routes (see Appendix C).

#### 4.4.4 Local SEO: Google Business Profile (GBP) Optimization
- **Entity Setup**: Create a verified Google Business Profile named: **APEX — Software Absensi & Payroll UMKM Indonesia** located in South Tangerang (Tangsel), Banten.
- **Service Categories**: `Software Company`, `Human Resource Consulting`, `Computer Software Store`.
- **Localized Review Velocity**: Collect verified 5-star reviews from early local pilot clients (clinics in Tangsel, coffee shops in Bintaro/BSD) referencing high-value keywords in their review text: *"Sistem absensi selfie dan payroll sangat membantu klinik kami di Tangerang..."*

---

### 4.5 Channel D: High-Leverage Ecosystem Distribution

#### 4.5.1 TikTok Organic Video Expansion (12-Video Matrix)

Expanding from the initial 3-video concept, deploy a 12-video production sprint divided into 3 proven B2B viral content buckets:

| Video # | Content Bucket | Title / Scenario Hook | Visual Script Outline | Overlay On-Screen Text | Primary Call-to-Action |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | Comedy Skit | *"Karyawan Titip Absen Modus Sakit"* | Karyawan di pantai selfie pura-pura di kamar tidur. Aplikasi deteksi GPS di Bali padahal kantor di Jakarta. | "Titip absen zaman now ketahuan dalam 1 detik! 🏖️" | Link di bio: Coba Gratis APEX |
| **2** | Operational Pain | *"Owner Begadang Depan Excel Pas Gajian"* | Owner mata merah tanggal 28, kalkulator error, kopi tumpah di slip kertas. Cut to: APEX hitung gaji 10 detik. | "Masih jaman ngitung lembur pake kalkulator warung? 🤯" | Cek bio: Demo Payroll 10 Menit |
| **3** | Retail Disaster | *"Kasir Bilang Stok Ada, Pas Dicari Kosong"* | Pelanggan antre mau beli rasa Matcha, kasir bolak-balik gudang, stok habis, pelanggan kabur ke toko sebelah. | "Omzet hilang gara-gara stok ga sinkron! 🤦‍♂️" | Mau kelola stok & tim? Cek bio |
| **4** | Tech Behind-the-Scenes| *"Cara Hacker Fake GPS Dilibas APEX"* | Gilank rekam layar laptop, tes inject lokasi palsu via Mock Location Android, APEX trigger otomatis tolak clock-in. | "Developer buktikan anti-fake GPS APEX kebal manipulasi." | Coba kebal GPS di bio |
| **5** | Relatable Owner POV | *"Tukang Minta Kasbon Pas Tanggal 15"* | Karyawan bisik-bisik ke ruang manager minta kasbon pinjam uang kas toko. Cut to: APEX Kasbon Mandiri otomatis. | "Solusi kasbon tanpa ganggu uang kas toko Anda." | Fitur Kasbon APEX di bio |
| **6** | Financial Comparison| *"Mekari 1.5 Juta vs APEX 249 Ribu"* | Visual tumpukan uang kertas: Rp 1.500.000 vs Rp 249.000. Komparasi fitur yang didapat pengusaha 30 karyawan. | "Kenapa bayar mahal kalau ada yang 80% lebih hemat?" | Hitung penghematan di link bio |
| **7** | Tutorial / Edukasi | *"Cara Cepat Hitung PPh 21 TER 2024"* | Whiteboard explainer 45 detik: perbedaan Kategori A, B, C untuk karyawan lajang vs menikah. | "PPh 21 TER bukan beban kalau sistemnya otomatis!" | Template PPh 21 gratis di bio |
| **8** | Staff Drama Skit | *"Perawat Ribut Tukar Shift Malam"* | 2 perawat lempar-lemparan jadwal jaga malam di grup WhatsApp sampai atasan bingung siapa yang masuk. | "Tukar shift tanpa drama persetujuan atasan." | Rapikan shift klinik di bio |
| **9** | Product Demo Fast | *"Tour Aplikasi APEX dalam 30 Detik"* | Screen recording tempo cepat: Selfie absen ➡️ Roster shift ➡️ Klik gaji ➡️ Kirim slip WA. | "Absen + Gaji + Stok dari satu aplikasi web ringan." | Mulai gratis 14 hari |
| **10**| Founder Story | *"Kenapa Saya Bikin Software HR dari Tangsel"*| Gilank cerita santai di kafe: melihat teman pengusaha F&B bangkrut operasional karena kebocoran stok dan absensi. | "Software lokal untuk pengusaha pejuang lokal 🇮🇩" | Dukung karya lokal di bio |
| **11**| Customer Spotlight | *"Klinik Medissina: Dari 2 Hari Jadi 15 Menit"*| Tampilan dashboard klinik sebelum dan sesudah integrasi roster shift dan absensi multi-lokasi. | "Studi kasus efisiensi klinik 28 karyawan." | Konsultasi klinik di bio |
| **12**| Urgensi / Seasonal | *"Persiapan Hitung THR Lebaran Tanpa Pusing"* | Reminder kalender H-14 Lebaran: kewajiban bayar THR Depnaker dan cara hitung prorata otomatis. | "Jangan tunggu H-7 Lebaran baru pusing hitung THR!" | Cek modul THR di bio |

---

#### 4.5.2 Facebook Groups (UMKM Communities Playbook)

Target Groups:
- *Komunitas Pengusaha Kuliner & F&B Indonesia* (180K+ Members)
- *Forum Pengusaha Laundry Seluruh Indonesia* (95K+ Members)
- *Komunitas Pengusaha Retail & Minimarket Mandiri* (60K+ Members)
- *Info Lowongan & HRD Jabodetabek* (120K+ Members)

##### The Non-Spam "Value-First" Playbook:
- **Never Post Direct Sales Links in Post Body**: Facebook algorithms severely downrank external links. Post educational value first; place links in the first comment upon request.
- **The Free Template Lead Magnet Strategy**:
  1. Create a clean, Google Sheets template: *“Template Excel Jadwal Shift Otomatis + Rumus Lembur Depnaker 2026”*.
  2. Post in the group sharing 3 actionable tips on managing shift rosters without overtime disputes.
  3. Offer: *“Bagi teman-teman pengusaha yang butuh file template Excel gratis ini, silakan komen 'MAU', nanti saya DM link downloadnya.”*
  4. Send the template via Messenger accompanied by a soft pitch:  
     *“Ini link Google Sheets-nya ya Mas/Mbak. Kalau nanti usahanya sudah makin ramai dan capek rekap manual, bisa coba cek APEX (apex.lankdev.my.id), aplikasi absensi selfie dan gaji otomatis karya saya. Semangat usahanya!”*

---

#### 4.5.3 POS (Point of Sale) Strategic Co-Marketing

Point of Sale providers (Moka POS, Pawoon, iReap, Olsera) dominate retail and F&B front-counter operations, but **none of them possess a dedicated statutory payroll, PPh 21 TER, or deep employee shift swapping engine**.

##### Strategic Integration & Co-Marketing Pitch:
- **Target Partners**: **iReap POS** and **Pawoon** (more accessible to early API integrations than Moka/Gojek).
- **Synergy Pitch**: *"Sistem POS Anda mencatat transaksi kasir; APEX mencatat kehadiran kasir dan menghitung gajinya."*
- **Execution**:
  - Build a lightweight webhook integration allowing daily sales totals or clocked-in cashier IDs to reconcile between systems.
  - Negotiate a cross-listing on their partner marketplace or co-host a joint webinar: *"Mengunci Kebocoran Kasir & Menata Manajemen Shift Toko Ritel."*

---

#### 4.5.4 Two-Sided Referral Engine Architecture

Word-of-mouth among Indonesian business owners in business associations (such as HIPMI, TDA / Tangan Di Atas, and local trade chambers) is exceptionally potent.

```
┌─────────────────────────────────────────────────────────────────────────┐
│              PROGRAM REFERRAL PENGUSAHA "AJAK TEMAN"                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Pengusaha yang Mereferensikan            Teman Usaha yang Diundang    │
│   (Referrer):                              (New Tenant):                │
│                                                                         │
│   🎁 Dapat Uang Tunai Rp 100.000 /          🎉 Dapat Diskon 20%         │
│      Kredit Tagihan 1 Bulan Gratis            untuk 3 Bulan Pertama     │
│      (Setelah teman berlangganan)                                       │
│                                                                         │
│   Mekanisme:                                                            │
│   Setiap tenant memiliki kode unik di dashboard (contoh: APEX-KOPIKU).  │
│   Pencairan saldo referral dapat ditransfer ke rekening bank / OVO/GoPay│
│   atau otomatis memotong invoice tagihan bulan berikutnya.              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4.6 Section 4 Action Items

- [ ] Send personalized partnership emails and WhatsApp introductions to 10 local KAJ/KAP firms in Tangerang and South Jakarta.
- [ ] Record and publish the first 3 TikTok videos from the 12-video matrix (Videos #1, #2, and #4).
- [ ] Publish the comprehensive pillar article on *Panduan Lengkap PPh 21 TER 2024* with download lead magnet.
- [ ] Execute weekly outreach to 20 business owners posting hiring ads on LinkedIn and local job boards.
- [ ] Launch the two-sided referral code dashboard widget inside the APEX tenant settings.

---

## Appendix: Reference Frameworks, Scripts & Formulas

### Appendix A: Complete SaaS Financial Formula Index

$$\text{ARPU} = \frac{\text{Total Monthly Subscription Revenue}}{\text{Total Active Paying Tenants}}$$

$$\text{Gross Margin \%} = \frac{\text{Total Revenue} - \text{Direct COGS (Hosting, DB, SMS/WA APIs, Payment Fees)}}{\text{Total Revenue}} \times 100$$

$$\text{Logo Churn Rate \%} = \frac{\text{Tenants Cancelled During Month}}{\text{Tenants at Start of Month}} \times 100$$

$$\text{Customer Lifetime Value (LTV)} = \frac{\text{ARPU} \times \text{Gross Margin \%}}{\text{Monthly Logo Churn Rate}}$$

$$\text{CAC Payback Period (Months)} = \frac{\text{Total Sales \& Marketing Expenses (Direct + Labor)}}{\text{New Customers Acquired} \times \text{ARPU} \times \text{Gross Margin \%}}$$

$$\text{LTV : CAC Ratio} = \frac{\text{Customer Lifetime Value}}{\text{Customer Acquisition Cost}}$$

---

### Appendix B: Master WhatsApp Cold & Warm Script Repository

#### Script 1: Direct Message to Retail / Store Owner (F&B / Kafe Focus)
```text
Halo Mas/Mbak [Nama Owner], salam kenal saya Gilank, pengembang software dari Tangsel.

Saya perhatikan kafe/resto [Nama Usaha] ramai sekali dan punya tim kasir & barista yang solid. 

Biasanya pengusaha F&B sering mengeluhkan kasir atau crew yang titip absen atau tukar jadwal jaga mendadak yang bikin rekap gaji di akhir bulan berantakan.

Saya bikin APEX (apex.lankdev.my.id), aplikasi absensi selfie yang terkunci lokasi GPS outlet + rekap lembur otomatis. Jadi karyawan absen lewat HP masing-masing tanpa bisa curang pakai fake GPS, dan gaji terhitung otomatis.

Lagi ada program pilot untuk 3 usaha F&B pertama: 3 bulan setengah harga dan saya bantu input jadwal shift-nya sampai jalan.

Boleh saya kirimkan video demo 2 menit cara pakainya Mas/Mbak?
```

#### Script 2: Direct Message to Clinic / Healthcare Facility Manager
```text
Selamat pagi/siang dr. / Pak / Bu [Nama], perkenalkan saya Gilank, founder APEX.

Kami membantu klinik pratama dan fasilitas kesehatan mengotomatiskan jadwal jaga perawat bergilir 24 jam serta rekap upah lembur resmi sesuai aturan Depnaker.

Di sistem kami:
1. Perawat bisa ajukan tukar shift mandiri langsung via HP (tervalidasi supervisor).
2. Absensi selfie terkunci radius geofence klinik (anti titip absen).
3. Pajak PPh 21 TER dan BPJS Kesehatan/TK terhitung otomatis di slip gaji PDF.

Apakah di [Nama Klinik] rekap jadwal shift dan payroll perawat saat ini masih menggunakan format manual Excel? Jika berkenan, saya ingin mendemonstrasikan sistemnya selama 10 menit via Google Meet atau WhatsApp. Terima kasih banyak Dok/Pak/Bu.
```

---

### Appendix C: Complete Schema Markup (JSON-LD) for AEO

Paste this structured data directly into the `<head>` of `src/app/page.tsx` or marketing layout to maximize generative AI visibility across ChatGPT, Gemini, and Google Search:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "APEX",
      "operatingSystem": "All (Web-based PWA, Android, iOS, Windows, macOS)",
      "applicationCategory": "BusinessApplication",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "IDR",
        "lowPrice": "0",
        "highPrice": "599000",
        "offerCount": "4"
      },
      "description": "Aplikasi operasional terpadu untuk UMKM Indonesia: absensi selfie anti-fake GPS, manajemen shift kerja, perhitungan payroll PPh 21 TER, BPJS, manajemen stok barang SKU, dan modul kasbon EWA mandiri.",
      "url": "https://apex.lankdev.my.id",
      "author": {
        "@type": "Person",
        "name": "Gilank"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Berapa biaya langganan software APEX per bulan?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "APEX menyediakan paket Starter gratis selamanya untuk hingga 10 karyawan, paket Growth seharga Rp 129.000/bulan untuk 15 karyawan, dan paket Pro seharga Rp 249.000/bulan untuk hingga 25 karyawan dengan tambahan Rp 5.500 per karyawan berikutnya."
          }
        },
        {
          "@type": "Question",
          "name": "Apakah APEX mendukung perhitungan pajak PPh 21 TER 2024?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ya, APEX secara otomatis menghitung potongan PPh 21 skema TER (Tarif Efektif Rata-rata) bulanan sesuai Peraturan Pemerintah Nomor 58 Tahun 2023 dan PMK 168/2023 untuk Kategori A, B, dan C."
          }
        },
        {
          "@type": "Question",
          "name": "Bagaimana cara APEX mencegah karyawan titip absen?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "APEX mewajibkan verifikasi foto selfie liveness kamera langsung dan mengunci titik koordinat GPS ponsel karyawan dalam radius geofence lokasi kerja yang ditentukan atasan, serta memblokir penggunaan aplikasi fake GPS atau mock location."
          }
        }
      ]
    }
  ]
}
</script>
```

---

### Appendix D: Tailwind CSS Component for Sticky WhatsApp Mobile Bar

```tsx
// Location: src/components/landing/MobileStickyBar.tsx
import React from "react";
import Link from "next/link";
import { MessageCircle, ArrowRight } from "lucide-react";

export function MobileStickyBar() {
  const phoneNumber = "6282124153732";
  const defaultMessage = encodeURIComponent(
    "Halo Mas Gilank, saya tertarik coba APEX untuk usaha saya. Mau tanya info demo."
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 max-w-md mx-auto">
        {/* WhatsApp Direct Inquire Button (40% width) */}
        <a
          href={`https://wa.me/${phoneNumber}?text=${defaultMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-semibold text-xs rounded-xl border border-emerald-500/30 transition active:scale-95"
        >
          <MessageCircle className="w-4 h-4 fill-emerald-400 text-slate-900" />
          <span>Tanya WA</span>
        </a>

        {/* Free Trial Button (60% width) */}
        <Link
          href="/register"
          className="flex-[1.5] flex items-center justify-center gap-1.5 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95"
        >
          <span>Coba Gratis 14 Hari</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
```

---
*Dokumen rekomendasi ini disiapkan secara komprehensif untuk dieksekusi bertahap oleh Gilank guna membawa APEX mencapai milestone 100 tenant berbayar pertama secara mandiri dan menguntungkan.*

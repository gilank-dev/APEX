# APEX — Strategic Competitive Moat & Feature Gap Analysis v2.0
## Indonesian B2B HR & Operational Control SaaS Market

> **Author**: Pam (Head of Product & Market Intelligence, LankDev Corp)  
> **Prepared for**: Gilank (Founder & Product Lead)  
> **Target Market**: Indonesian SMBs & Mid-Market Outlets (20–150 employees)  
> **Document Status**: Production Ready Strategy | Confidential  
> **Date**: September 2026  

---

## 1. Competitive Landscape Overview

The Indonesian HR software landscape is currently split into two polarized extremes:

```
  [HIGH COST / REGRESSIVE SEAT FEES]
                  ▲
                  │        ● Mekari Talenta (Rp 25k–100k/employee/mo + setup fee)
                  │
                  │        ● Gadjian + Hadirr (Dual-app, Rp 18k–25k/employee/mo)
                  │
                  │   ★ APEX Target Position
                  │   (Flat Rp 249k/mo • All-in-One Operations + HRIS)
                  │
                  │        ● Kerjoo (Rp 2k/head/day, attendance-only)
                  │
  ────────────────┼──────────────────────────────────────────►
  [LOW DEPTH]     │                             [HIGH OPERATIONAL DEPTH]
```

---

## 2. Competitive Feature Matrix

| Domain / Feature | APEX (v2.0 Target) | Mekari Talenta | Gadjian + Hadirr | Kerjoo |
| :--- | :---: | :---: | :---: | :---: |
| **Pricing Model** | **Flat Rp 249.000 / mo** (up to 100 staff) | Regressive per-head (Rp 25k+) + setup | Per-head (Rp 18k–25k) | Per-head / per-day |
| **Attendance Verification** | Geo Selfie + Hash Integrity | Face Rec + GPS | GPS (via Hadirr app) | Face Rec + GPS |
| **Offline PWA Sync** | ✅ (IndexedDB Sync Queue) | ❌ (Native app only) | ❌ (Native app only) | ❌ (Native app only) |
| **PPh 21 TER (2026 Rules)** | ✅ (PMK 168/2023 TER A/B/C) | ✅ (Full Tax Suite) | ✅ (Payroll engine) | ❌ (Raw hours only) |
| **BPJS Calc (TK & Kesehatan)**| ✅ (5 Program Rates + Caps) | ✅ (Full) | ✅ (Full) | ❌ (None) |
| **Kasbon / EWA Liquidity** | ✅ (DB-enforced Cap & Repay) | ⚠️ (Via Mekari Flex add-on) | ✅ (Via Payuung integration)| ❌ (None) |
| **THR Computation Engine** | ✅ (Permenaker 6/2016 Prorate) | ✅ (Full) | ✅ (Full) | ❌ (None) |
| **Operational Utilities** | ✅ (Task Kanban, SKU Stock, Shift Swap)| ❌ (HR-only, no inventory/tasks)| ❌ (No inventory/tasks)| ❌ (Attendance only) |

---

## 3. APEX's Strategic Moats

### Moat 1: Cost Arbitrage & Predictable Flat Pricing
- **Competitor Flaw**: Mekari and Gadjian penalize growing companies. A 60-employee store pays Rp 1.500.000 to Rp 3.000.000 every month on software seats.
- **APEX Moat**: **Flat Rp 249.000/month** for up to 100 members. Customers save tens of millions per year while getting full workforce control.

### Moat 2: Unified Operational & HR Platform
- **Competitor Flaw**: Stores currently buy one tool for attendance (Kerjoo/Hadirr), another for payroll (Excel/Gadjian), and use WhatsApp for shift swaps and task tracking.
- **APEX Moat**: One single unified PWA covering **Attendance + Shift Rosters + Shift Swaps + Leave + PPh 21 Payroll + Kasbon + Inventory SKU Tracking + Task Board**.

### Moat 3: Zero-Burden & Tamper-Proof Audit Trail
- **Competitor Flaw**: Heavy native apps consume high storage on low-end employee Android devices and suffer from offline failures.
- **APEX Moat**: Lightweight PWA with client-side image compression, IndexedDB offline queueing, and PostgreSQL immutable triggers on attendance logs preventing supervisor fraud.

---

## 4. Product Roadmap & Strategic Milestones (Q4 2026 – Q2 2027)

```
[Phase 1: Compliance & Core Operations] ──► [Phase 2: Fintech & Automation] ──► [Phase 3: Ecosystem Scale]
- PPh 21 TER Engine + BPJS              - WhatsApp Webhook Auto-Payslip        - Open API & Webhook SDK
- Kasbon (EWA) Liquidity Cap           - Automated Bank Transfer Payouts       - Multi-Store ERP Integrations
- Permenaker 6/2016 THR Prorate        - Dynamic Roster AI Suggestion          - Franchise Multi-Tenant Node
```

---
*End of Document. Prepared by Product & Market Intelligence (LankDev Corp).*

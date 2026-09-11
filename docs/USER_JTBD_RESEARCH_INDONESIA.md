# APEX — Jobs-To-Be-Done (JTBD) & Psychographic Profiling Research
## Target Market: Indonesian Multi-Outlet SMBs, F&B, Retail, & Service Outlets

> **Author**: Pam (Head of Product & Market Intelligence, LankDev Corp)  
> **Prepared for**: Gilank (Founder & Product Lead)  
> **Target Audience**: Indonesian Franchise Owners, F&B Operations Managers, Multi-Store Retail Admins (20–150 employees)  
> **Document Status**: Official Research Artifact | Confidential  
> **Date**: September 2026  

---

## 1. Executive Summary

Indonesian Small-to-Medium Businesses (SMBs) in multi-outlet retail, F&B chains, and service clinics operate under severe operational friction. Existing HR software options force them into a dilemma:
- **Enterprise Suites (Mekari Talenta, GreatDayHR)**: Expensive (Rp 25.000–85.000/employee/month + implementation fees), overly complex, heavy on low-end smartphones, and penalizing growth.
- **Consumer Tools (WhatsApp + Excel)**: Zero audit trail, prone to attendance fraud (*titip absen*), manual error-ridden payroll recalculations every month, and complete lack of stock or shift control.

This document delivers a comprehensive **Jobs-To-Be-Done (JTBD)** framework, psychological persona profiles, and push-pull switching dynamics to guide APEX's product roadmap and user experience design.

---

## 2. Jobs-To-Be-Done (JTBD) Framework

### 2.1 Core Functional Jobs

1. **"When I run a multi-outlet shift operation"**
   * **Job**: I want to verify that staff actually show up at the assigned store location at the correct shift start time.
   * **Desired Outcome**: Zero attendance fraud (*titip absen* / fake GPS), zero administrative friction for outlet supervisors.

2. **"When end-of-month payroll processing arrives"**
   * **Job**: I want to compute employee monthly compensation (basic salary, shift allowances, overtime, late penalties, Kasbon deductions, statutory PPh 21 TER & BPJS) automatically without spreadsheets.
   * **Desired Outcome**: 100% accurate salary slip generation in minutes, compliant with Indonesian labor standards (PP 36/2021 & PMK 168/2023).

3. **"When cash or inventory is handled by shift staff"**
   * **Job**: I want to reconcile daily cash drawer balances and raw ingredient / SKU stock levels per shift handover.
   * **Desired Outcome**: Immediate detection of variance (*selisih kas / barang hilang*) before staff leave the premises.

---

### 2.2 Emotional & Social Jobs

* **Emotional Job (Fear & Relief)**: 
  - *"I want to stop worrying about whether my outlet supervisors are colluding with employees to fake attendance or tamper with payroll logs."*
  - *"I want peace of mind knowing I won't get audited or fined by Disnaker / Tax Authorities over incorrect PPh 21 TER or BPJS calculations."*

* **Social Job (Status & Reputation)**:
  - *"I want to present my business to investors and franchise buyers as a modern, digitized enterprise with automated operational controls."*
  - *"I want my employees to view our payroll process as fair, transparent, and trustworthy, with instant digital payslips via WhatsApp."*

---

## 3. Psychological User Personas

### Persona 1: Pak Hendra — The Multi-Outlet F&B Franchise Owner (Primary Buyer)
* **Demographics**: Age 38, Owner of 4 Coffee & Pastry Outlets in Jabodetabek (45 total staff).
* **Core Pains**:
  - Pays Rp 1.500.000+/month just for HR software licenses under legacy per-head models.
  - Constant shift absenteeism and late clock-ins during peak weekend hours.
  - Spends 3 full days every month manually calculating salary, Kasbon deductions, and THR in Excel.
* **Anxieties & Switching Barriers**:
  - Fear that staff will refuse to install a complex mobile app.
  - Concern over losing historical attendance data during migration.
* **APEX Solution Alignment**:
  - **Flat-rate pricing (Rp 249.000/month)**: Saves 80%+ compared to Mekari.
  - **Geo-locked selfie clock-in**: No app install needed (PWA), instant GPS + selfie verification.
  - **Automated PPh 21 TER + BPJS engine**: 1-click payslip generation.

---

### Persona 2: Mbak Rani — The Store Manager / HR Coordinator (Daily Power User)
* **Demographics**: Age 29, Managing 12 retail staff at a fashion outlet in South Tangerang.
* **Core Pains**:
  - Bombarded with WhatsApp messages from staff requesting shift swaps, leave (*cuti*), or Kasbon advances.
  - Forced to manually cross-reference shift rosters against WhatsApp photos.
  - High stress during cashier shift handovers when cash drawer totals don't match POS reports.
* **Anxieties & Switching Barriers**:
  - Worry that a new system will take hours of daily administration or create complex setup tasks.
* **APEX Solution Alignment**:
  - **Consent-Based Shift Swap & Leave Module**: Structured 1-click approval flow with automatic roster updates.
  - **Blind Cash Drawer Audit & Stock Opname**: Streamlined digital audit trail per shift handover.

---

## 4. Push-Pull Switching Model (Four Forces Framework)

```
                       [SWITCH TO APEX]
                             ▲
                             │
     PUSH OF PRESENT         │         PULL OF APEX
     SITUATION               │         ATTRACTIVENESS
  - High Mekari bills        │      - Flat Rp 249k/month
  - Spreadsheets error-prone │      - Geo selfie + Kasbon + THR
  - Attendance fraud         │      - 1-click WA payslips
                             │
  ───────────────────────────┼───────────────────────────►
                             │
     ANXIETY OF CHANGE       │         HABIT OF THE PRESENT
  - Data migration hassle    │      - "WhatsApp + Excel works fine"
  - Staff app adoption       │      - "We are used to manual cash"
  - Implementation downtime  │      - Status quo bias
                             │
```

---

## 5. Product Action Items & PRD Requirements for APEX v2.0

1. **Frictionless WhatsApp Integration**:
   - Provide instant payslip notification links directly sent via WhatsApp webhook (`/api/webhooks/whatsapp`).
2. **Offline-First PWA Resilience**:
   - Ensure staff in low-signal basement outlets (e.g., mall food courts) can clock-in offline using IndexedDB sync queue.
3. **Transparent Financial Liquidity (Kasbon / EWA)**:
   - Cap Kasbon requests to 50% of earned monthly wages with automatic payroll deduction rules to eliminate bad debt risk for employers.

---
*End of Document. Synthesized by Product & Market Intelligence (LankDev Corp).*

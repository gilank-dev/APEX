# APEX — Zero Lock-In Data Export Specification
## Architecture & User Data Sovereignty Protocol

> **Author**: Pam (Head of Product & Market Intelligence, LankDev Corp)  
> **Prepared for**: Gilank (Founder & Product Lead)  
> **Target Audience**: APEX Engineering Team, Tenant Administrators, Disnaker Auditors  
> **Document Status**: Production Specification v1.0 | Approved  
> **Date**: September 2026  

---

## 1. Executive Summary & Vision

A major barrier preventing Indonesian SMB owners from adopting B2B SaaS platforms is **Data Hostage Anxiety**—the fear that if they ever decide to cancel their subscription, their historical employee records, attendance logs, and payroll tax records will be lost or locked behind a paywall.

APEX implements a strict **Zero Lock-In Data Sovereignty Policy**:
1. Every tenant administrator can download their **entire company dataset** at any time with 1-click in standard formats (CSV, JSON, XLSX).
2. Data export is available across **all tiers** (including Free and expired Trial accounts).
3. All exported archives are encrypted in transit and cryptographically verified using SHA-256 integrity hashes.

---

## 2. Export Schema & Archive Structure

When a tenant admin triggers a **Full Data Export**, APEX compiles a structured `.zip` package containing the following canonical files:

```
apex_export_[slug]_[YYYYMMDD].zip
├── 01_company_metadata.json          # Tenant profile, active modules, tier status
├── 02_employee_roster.csv            # Employee master list (Name, NIK, Role, Hire Date, PTKP)
├── 03_attendance_logs.csv            # Raw clock-in/out timestamps, GPS coords, photo hashes
├── 04_payroll_historical.csv         # Monthly gross, TER tax, BPJS deductions, net take-home
├── 05_kasbon_ledger.csv              # Kasbon requests, repayment schedules, remaining balances
├── 06_leave_and_shift_swaps.csv      # Leave requests, approval records, shift swap logs
├── 07_inventory_and_sku.csv          # Stock asset logs, condition histories, audit records
└── CHECKSUM.sha256                   # SHA-256 cryptographic manifest of all export files
```

---

## 3. Detailed File Data Specifications

### 3.1 Employee Roster (`02_employee_roster.csv`)
Columns:
- `user_id` (UUID)
- `full_name` (Text)
- `email` (Text)
- `role_name` (Text: Admin / Manager / Employee)
- `ptkp_status` (Text: TK/0 .. K/3)
- `hire_date` (ISO Date: YYYY-MM-DD)
- `fixed_allowance` (Numeric IDR)
- `created_at` (ISO Timestamp)

### 3.2 Attendance Logs (`03_attendance_logs.csv`)
Columns:
- `log_id` (UUID)
- `user_id` (UUID)
- `employee_name` (Text)
- `clock_in_time` (ISO 8601 Timestamp)
- `clock_out_time` (ISO 8601 Timestamp)
- `latitude` (Decimal)
- `longitude` (Decimal)
- `photo_hash` (SHA-256 Hex Digest)
- `status` (Text: open / closed)

### 3.3 Historical Payroll (`04_payroll_historical.csv`)
Columns:
- `payroll_id` (UUID)
- `user_id` (UUID)
- `payroll_month` (YYYY-MM)
- `base_salary` (Numeric IDR)
- `overtime_pay` (Numeric IDR)
- `fixed_allowance` (Numeric IDR)
- `thr_amount` (Numeric IDR)
- `gross_wages` (Numeric IDR)
- `pph21_ter_tax` (Numeric IDR)
- `bpjs_employee_deduction` (Numeric IDR)
- `kasbon_deduction` (Numeric IDR)
- `net_take_home_pay` (Numeric IDR)
- `snapshot_hash` (SHA-256 Verification Hash)

---

## 4. Security & Compliance Protocol

1. **Authorization Gate**:
   - Only users with role `Admin` can execute full company data exports via `getCallerProfile()`.
2. **PII Protection**:
   - Password hashes are **NEVER** included in exports.
   - Raw Base64 photo strings are excluded; signed storage paths or photo SHA-256 hashes are exported to prevent payload bloat.
3. **Audit Trail Logging**:
   - Executing an export creates an immutable log entry in `audit_events` recording admin ID, timestamp, and client IP.

---
*End of Specification. Authored by Product & Market Intelligence (LankDev Corp).*

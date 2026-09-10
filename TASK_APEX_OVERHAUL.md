# APEX Overhaul Master Task Plan

Owner: Bos Gilank (Founder)
Orchestrator: Team Lead (@leader_lankdevbot)
Project Directory: C:\Users\HYPE AMD\files\PROJECT\APEX

---

## Current Sprint Goal
Make APEX (apex.lankdev.my.id) a production-grade, highly converting, and feature-complete Indonesian HR SaaS platform.

---

## Workstreams & Role Ownership

### 1. Landing Page & Copywriting Overhaul
- Business & Growth (@business_lankdevbot) + Product & Research (@research_lankdevbot)
- Status: In Progress
- Tasks:
  - [ ] Rewrite landing page text fully in professional Indonesian
  - [ ] Add interactive PEPM pricing calculator (Starter, Growth, Pro)
  - [ ] Add direct WhatsApp CTA buttons for instant SMB conversion
  - [ ] Localize FAQ section for Indonesian HR compliance

### 2. Frontend UI/UX & Offline Resilience
- Software Engineer (@software_engineer_lankdevbot)
- Status: Pending Execution
- Tasks:
  - [ ] Replace all raw alert() calls with sonner Toast notifications
  - [ ] Refactor OfflineSyncProvider with exponential backoff & conflict UI
  - [ ] Polish industrial dark theme components and mobile responsiveness

### 3. Core Engine & DB Migrations
- Lead Engineer (@Lead_Engineer_lankdevbot) + Software Engineer (@software_engineer_lankdevbot)
- Status: In Progress
- Tasks:
  - [x] Run migration 20260910000009_kasbon.sql (Earned Wage Access) — applied & live-verified
  - [x] Run migration 20260910000010_thr.sql (Tunjangan Hari Raya) — applied & live-verified
  - [x] Implement client-side SHA-256 hashing for selfie attendance verification (wired into clock-in; migration 20260910000011 applied)
  - [~] Build PPh 21 TER 2026 & BPJS calculation engine — engine + fail-closed tests DONE (src/lib/ter-engine.ts, 14 tests); bracket data pending verified research (research/payroll-2026-params.json); wire-into-payroll.ts BLOCKED on verified data (never ship unverified tax numbers)
  - NOTE: 7 parallel migrations quarantined — see QUARANTINE_VERDICT.md (hallucinated tables + security regressions). Do NOT reapply without review.

### 4. QA, Testing & CI/CD Pipeline
- Software Engineer (@software_engineer_lankdevbot) + Lead Engineer (@Lead_Engineer_lankdevbot)
- Status: CI Done / E2E Pending
- Tasks:
  - [x] Create .github/workflows/ci.yml for automated tests on push/PR
  - [ ] Add Vitest & Playwright E2E setup for selfie clock-in & payroll
  - [x] Increase unit test coverage from 46 to 100+ assertions (now 70 tests incl. kasbon/THR/TER/BPJS suites)

---

## Execution Rule
All coding execution must be run using OpenCode CLI (model: claude-3.7-sonnet / deepseek-r1) or Antigravity CLI (model: gemini-2.0-flash).

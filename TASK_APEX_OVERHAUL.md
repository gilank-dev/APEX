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
- Status: Ready to Apply
- Tasks:
  - [ ] Run migration 20260910000009_kasbon.sql (Earned Wage Access)
  - [ ] Run migration 20260910000010_thr.sql (Tunjangan Hari Raya)
  - [ ] Implement client-side SHA-256 hashing for selfie attendance verification
  - [ ] Build PPh 21 TER 2026 & BPJS calculation engine

### 4. QA, Testing & CI/CD Pipeline
- Software Engineer (@software_engineer_lankdevbot) + Lead Engineer (@Lead_Engineer_lankdevbot)
- Status: Pending Setup
- Tasks:
  - [ ] Create .github/workflows/ci.yml for automated tests on push/PR
  - [ ] Add Vitest & Playwright E2E setup for selfie clock-in & payroll
  - [ ] Increase unit test coverage from 46 to 100+ assertions

---

## Execution Rule
All coding execution must be run using OpenCode CLI (model: claude-3.7-sonnet / deepseek-r1) or Antigravity CLI (model: gemini-2.0-flash).

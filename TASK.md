# APEX: Public /pricing Page + Landing Copy Fix (Funnel Leak Fix)

You are working in the APEX repo (Next.js 16 App Router, React 19, TS, Tailwind v4, Supabase). Read `AGENTS.md` at repo root first — this Next version has breaking changes; check `node_modules/next/dist/docs/` if unsure about APIs.

## Context

APEX (https://apex.lankdev.my.id) is a multi-tenant HR SaaS (attendance, tasks, inventory, billing). Critical funnel bug: visiting `/pricing` redirects to `/login` because the middleware (`src/proxy.ts`) treats every first-level path outside its blacklist as a tenant company slug and demands auth. Ad visitors can never see prices. This blocks all paid marketing.

## Job 1 — Fix the middleware blacklist (`src/proxy.ts`)

The `blacklist` array currently has: admin, api, auth, login, register, join, dashboard, billing, support, public, super-admin.

Add `'pricing'` to that array. That single change stops `/pricing` from being treated as a tenant slug. Do NOT change anything else in the file.

## Job 2 — Create public pricing page (`src/app/pricing/page.tsx`)

New PUBLIC route (no auth, server component). Reuse the landing design language: import `LandingHeader` and `LandingFooter` from `@/components/landing/`, same Tailwind classes / orange theme / mono-uppercase accents as `src/app/page.tsx`.

Copy language: Indonesian for body copy (target reader: Indonesian SME owner, 20-50 employees). Small English mono-uppercase accents for section labels are fine for design continuity.

### Content

Title block: label `PRICING`, H1 like `Harga jelas, tanpa kejutan.` Subtitle: `Semua rencana termasuk trial Pro 14 hari gratis. Tanpa kartu kredit, berhenti kapan saja.`

Three plan cards, EXACT same features and prices as `src/components/shared/SubscriptionLayout.tsx` (read it, mirror the card styling: same borders, ring, shadow, "recommended" treatment on Pro, dark slate style for Enterprise):

1. **Free** — `Rp 0` / selamanya. Features (copy from Free Tier in SubscriptionLayout): Up to 15 Workspace Members, 90-Day Attendance Log Retention, Access to Attendance & Task Board, Daily Automated Backups. CTA: `Mulai Gratis` → `/register` (Link).
2. **Pro** (recommended, ring-primary like SubscriptionLayout) — `Rp 249.000` / bulan, subtext `atau Rp 1.990.000 / tahun (hemat 33%)`. Features (copy from Pro Tier): Up to 100 Workspace Members, 1-Year Attendance Log Retention, Full Access to All Features, Priority WhatsApp Support, Overtime & Bonus Calculator. CTA: `Coba Gratis 14 Hari` → `/register` (Link).
3. **Enterprise** — price shows `Hubungi Kami` (no fixed price; do not show Rp numbers). Features (copy from Enterprise Tier): Unlimited Workspace Members, Infinite Attendance Log Retention, All Features & Custom API Access, 24/7 Support & Dedicated Account Manager, Isolated Tenant Sub-Node. CTA: `Chat WhatsApp` → external `https://wa.me/6282124153732?text=Halo%2C%20saya%20tertarik%20paket%20Enterprise%20Apex.%20Bisa%20info%20lebih%20lanjut%3F` with target/rel noopener.

Below the cards, a short payment-trust note (honest, no fake claims): `Pembayaran manual via WhatsApp. Setelah konfirmasi transfer, paket aktif maksimal 1x24 jam.`

Then a 3-item FAQ (static, no accordion needed):
- `Berapa lama trial gratis?` → `14 hari akses penuh fitur Pro. Tanpa kartu kredit.`
- `Bagaimana cara upgrade ke Pro?` → `Daftar gratis, coba 14 hari, lalu hubungi admin via WhatsApp dari halaman billing.`
- `Bisa berhenti kapan saja?` → `Ya. Tanpa kontrak, tanpa penalti.`

Final CTA band (orange bg like landing's global CTA): H2 `Masih ragu? Lihat sendiri dulu.` Buttons: `Coba Gratis Sekarang` → `/register`, and `Chat WhatsApp` → `https://wa.me/6282124153732?text=Halo%2C%20saya%20tertarik%20demo%20Apex.%20Bisa%20lihat%20tampilannya%3F`.

### Metadata (server component export)

- title: `Harga & Paket Apex — Free, Pro Rp 249.000/bulan, Enterprise`
- description: `Lihat harga Apex transparan: paket Free selamanya, Pro Rp 249.000/bulan, Enterprise custom. Absensi selfie, payroll otomatis, dan inventaris dalam satu aplikasi. Coba gratis 14 hari.`
- alternates.canonical: `/pricing`
- openGraph: title `Harga Apex — Mulai Gratis, Pro Rp 249rb/bulan`, description same as above, url `${SITE_CONFIG.url}/pricing` (import SITE_CONFIG from `@/lib/site`).

## Job 3 — Landing copy fix (`src/app/page.tsx`)

1. H1: replace `Scale your enterprise operations with lightning-fast automation.` with `Absensi selfie, payroll otomatis, stok kelihatan. Satu aplikasi.`
2. Hero paragraph: replace the current English subline with: `Rekap absensi karyawan terverifikasi selfie, hitung gaji otomatis tanpa Excel, dan pantau stok semua cabang dari satu dashboard.`
3. Badge above H1: replace `AUTOMATED WORKFLOWS, PAYROLL, & INVENTORY` with `ABSISI • PAYROLL • STOK — SATU DASHBOARD`.
4. Metadata: title → `Apex — Absensi Selfie, Payroll Otomatis & Inventaris | Satu Aplikasi`; description → Indonesian short version: `Absensi selfie terverifikasi, payroll otomatis, dan monitoring stok dalam satu aplikasi. Gratis 14 hari, tanpa kartu kredit.`; openGraph title/description match the same Indonesian copy. Remove `Enterprise Operations Control Node` from this page's metadata/OG (leave `src/lib/site.ts` untouched).
5. Hero WhatsApp button href: change text param to `Halo%2C%20saya%20tertarik%20demo%20Apex.%20Bisa%20lihat%20tampilannya%3F`, keep label `WhatsApp Demo` (rename from `WhatsApp Sales`).

## Job 4 — Navigation links

1. `src/components/landing/LandingHeader.tsx`: add a `Harga` link (`href="/pricing"`) in the desktop nav next to Fitur/Solusi/Resources, and in the mobile dropdown menu. Style consistent with existing nav items.
2. `src/components/landing/LandingFooter.tsx`: add `Harga / Pricing` link (`href="/pricing"`) at the top of the Company column list.
3. `src/app/sitemap.ts`: add `/pricing` entry (priority 0.9, weekly).

## Constraints

- NO new npm dependencies.
- Keep design system (colors, fonts, motion) untouched.
- Do not touch auth flows, RLS, migrations, SubscriptionLayout, super-admin, billing logic.
- All WA links external with `target="_blank" rel="noopener noreferrer"`.

## Verification (do all, fix failures)

1. `npx tsc --noEmit` passes.
2. `npm run build` succeeds.
3. `grep -rn "Enterprise Operations Control Node" src/app/page.tsx` returns nothing.
4. `grep -n "pricing" src/proxy.ts` shows the blacklist entry.

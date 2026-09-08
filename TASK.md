# APEX Cleanup: Honest Landing + WhatsApp Upgrade Flow

You are working in the APEX repo (Next.js 16 App Router, React 19, TS, Tailwind v4, Supabase). Read `AGENTS.md` at repo root first — this Next version has breaking changes; check `node_modules/next/dist/docs/` if unsure about APIs.

## Context

APEX is a multi-tenant HR SaaS (attendance, tasks, inventory, billing). The owner sells manually via WhatsApp (no payment gateway yet). A super-admin dashboard already exists at `/super-admin` (login: `super-lankdev` at `/login`) where the owner can change each company's tier via dropdown.

## Job 1 — Remove ALL fake claims from the landing page (`src/app/page.tsx`)

The current landing contains fabricated marketing. Remove/replace every one of these:

1. "4.8/5 di G2 Crowd & Capterra" badge (line ~508) — delete entirely.
2. "TRUSTED BY LEADING HIGH-GROWTH ENTERPRISES" section with fake client logos — delete the whole section.
3. Fake stats block (line ~106): "93% Payroll Processing Efficiency", "20 Mins Average Payroll Reconciliation", "10,000+ Active Monitored Personnel", "ISO 27001 Security & Integrity Standard" — replace with honest, factual stats: `Gratis 14 Hari` (Free 14-day Pro trial), `3 Modul` (Absensi/Tugas/Inventaris), `Multi-Tenant` (isolated workspace per company), `24/7` WhatsApp support response. Keep the same visual card style.
4. Fake testimonials (line ~113, "PT Wisma Kanta" etc.) — delete the entire testimonials section.
5. "ISO/IEC 27001" mentions anywhere (line ~372, ~661) — replace with the honest claims that ARE true: "Row Level Security (RLS) aktif di seluruh tabel" and "Enkripsi data offline di perangkat".
6. Footer (line ~808): `PT Lankdev Operations Indonesia` and `support@apex.local` — replace with `Apex by Lankdev` and a WhatsApp contact link (wa.me/6282124153732). Remove "© 2026 PT Lankdev Operations" company suffix.
7. The marquee text "Apex Campaign 2026 // Upgrade the Speed..." — keep but make sure it doesn't reference nonexistent awards.
8. Keep ALL existing styling/design language (bento grid, orange theme). Only content changes. Do NOT translate the whole page to Indonesian — keep the current English style, just remove lies. Exception: the two CTA labels can stay as-is.
9. Also scan for any other suspicious unverifiable claims (fake review scores, fake client counts, fake certifications) and remove them too.

## Job 2 — Replace fake QRIS modal with real WhatsApp upgrade request flow (`src/components/shared/SubscriptionLayout.tsx`)

Current problem: the "QRIS" SVG is decorative noise — not a scannable code. Selling fake payment QR is dishonest and dangerous. Replace the entire payment modal flow with this:

1. When user clicks a paid plan (Pro/Enterprise), generate a **request code** client-side: format `APX-{company.slug first 4 uppercase}-{6 random alphanum uppercase}` (e.g. `APX-SINA-7K2M9X`). Generate once per modal open.
2. Modal content (keep the premium design language):
   - Header: "Permintaan Upgrade {plan name}" + request code + tanggal.
   - Body explains honestly: "Pembayaran dilakukan manual via WhatsApp. Setelah konfirmasi transfer, admin akan mengaktifkan paket Anda (maks. 1x24 jam)."
   - Detail table: Perusahaan, Slug, ID Perusahaan, Paket sekarang → Paket baru, Harga, Periode (Bulanan/Tahunan).
   - Step list: 1) Klik tombol WhatsApp di bawah (pesan terisi otomatis), 2) Admin kirim detail pembayaran, 3) Setelah transfer dikonfirmasi, paket aktif dan notifikasi dikirim.
3. The WhatsApp button opens `https://wa.me/6282124153732?text=...` where text is a pre-filled message (Indonesian, use `\n` line breaks via %0A) containing: request code, company name, company id, slug, current tier, requested plan name, price, period (Bulanan/Tahunan). Example shape:
   `Halo Admin Apex, saya mau upgrade paket.\n\nKode Request: APX-SINA-7K2M9X\nPerusahaan: Sinar Harapan (APX-ID-123)\nPaket: Free → Pro\nHarga: Rp 249,000 / Bulanan\n\nMohon info pembayarannya. Terima kasih.`
4. Remove the fake QRIS SVG entirely and the 3-step QRIS scan instruction. Free plan "Activate Now" keeps just switching selection (no modal) — free plan click should do nothing beyond what it currently does, or show the same modal is fine WITHOUT WA message (skip free).
5. Keep monthly/yearly toggle, plan cards, prices exactly as they are.

## Job 3 — Super-admin password hardening (`src/lib/actions.ts`)

In `loginAdminAction` the super-admin seeding hardcodes password `super-lankdev`. Change: read password from `process.env.SUPER_ADMIN_PASSWORD` first; only fall back to the current value if env is unset (keep the platform usable). Same for email fallback logic — no other changes to the flow.

## Job 4 — Small copy fix on billing page

In `src/app/[slug]/billing/page.tsx` keep everything, but in `SubscriptionLayout` the "save 33%" yearly badge must stay consistent (it already is — just verify).

## Constraints

- NO new npm dependencies.
- Keep the design system (colors, fonts, motion) untouched except where a lie is removed.
- Indonesian copy for the new modal (as specified), English elsewhere.
- Don't touch auth flows, RLS, migrations, attendance logic.
- After edits, run `npm run build` and fix any errors you introduced. `npx tsc --noEmit` should pass.

## Verification checklist (do all)

- `npx tsc --noEmit` passes.
- `npm run build` succeeds.
- grep checks: `grep -rn "Capterra\|G2 Crowd\|ISO 27001\|apex.local\|PT Lankdev\|Wisma Kanta\|10,000" src/` returns NOTHING.
- The WhatsApp deep link builds with encodeURIComponent and contains the request code.

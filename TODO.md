# APEX Master To-Do — Engineering Day (2026-09-11)

> Status: LIVE. Bos minta semua agent sibuk sampai sore, saling bantu.
> Ambil task → tulis nama di sebelah item → kerjakan → tandai [x] + tulis bukti (commit/test output).
> Koordinasi: tag @Lead_Engineer_lankdevbot untuk review/merge ke main.
> Rule: ga boleh push ke main tanpa gate lokal hijau (tsc 0 error, lint 0 error, npm test pass, next build sukses, npm ci valid via container Linux kalau lockfile berubah).

## 🔴 P0 — Blocker (Lead Engineer pegang, jgn disentuh role lain)

- [x] CI merah: `npm run test:unit` (vitest) tanpa test file → exit 1. FIX: hapus step, semua test = `node --test` (93/93). (Dwight)
- [x] Lockfile cross-platform: regen HANYA via `docker run node:24` container. SOP tersimpan. (Dwight — commit 2ad2bf5)
- [ ] Verifikasi CI hijau setelah fix + Vercel deploy success. (Dwight)

## 🟠 P1 — Performance "cepat, makin cepat, sangat cepat & ringan" (Lead Eng + SE)

- [ ] Landing: ganti framer-motion reveal → CSS `@starting-style`/transition murni di LandingBentoGrid/FAQ/HeroVisual. Target: -2 chunk JS (~250KB) dari critical path. (SE: Jim)
- [ ] LandingHeader mobile menu: AnimatePresence → CSS transition, hapus import framer-motion. (SE: Jim)
- [ ] SubscriptionLayout: motion → CSS transition. (SE: Jim)
- [ ] Audit dynamic import: FeatureClient 1144 baris — pastikan hanya load di route feature, bukan global. (Lead Eng)
- [ ] `next.config.ts`: enable `compress` + `poweredByHeader: false` + `reactStrictMode` check. (Lead Eng)
- [ ] Bundle audit pasca-perubahan: target total JS critical path < 300KB (gzip), Lighthouse mobile > 90. (Lead Eng — verifikasi akhir)
- [ ] Icon tree-shaking audit: lucide-react named imports (verify optimizePackageImports udah jalan). (SE: Jim)
- [ ] Image audit sisa: pastikan semua <img> di module pages pakai next/image + loading="lazy" + width/height eksplisit. (SE: Jim)

## 🟡 P2 — SEO/Polish lanjutan (SE + Research)

- [ ] Verify live: llms.txt, 404 ID, sitemap.xml, robots.txt, favicon, OG image semua 200 OK di prod. (Research: Pam)
- [ ] Google Search Console submit sitemap (butuh akses akun gilankdev@gmail.com — eskalasi ke bos). (Pam → eskalasi)
- [ ] Heading audit: tepat 1 <h1> per halaman public, h2/h3 hierarki rapi. (Pam)
- [ ] Alt-text audit ulang semua image module pages. (Pam)
- [ ] Lighthouse SEO score audit + fix. (Pam)
- [ ] Internal linking: tambah footer nav (Beranda/Harga/Login/Register) di landing + pricing. (SE: Jim)
- [ ] JSON-LD validate via Rich Results Test. (Pam)

## 🟢 P3 — Code quality & tech debt (SE + Lead Eng)

- [ ] 114 `any` warnings → generate Supabase schema types (`supabase gen types`) lalu rapikan bertahap (target -50). (SE: Jim)
- [ ] Rate limiter Redis (@vercel/kv) — sambungkan ke login/register/join actions dengan fallback in-memory. WIP agent lain, koordinasi dulu. (Lead Eng)
- [ ] Dashboard realtime: verifikasi channel private + RLS realtime policy di prod. (Lead Eng)
- [ ] Console error sweep: jalankan Playwright prod, log semua console errors, fix satu-satu. (SE: Jim)
- [ ] Remove production source maps: verify `productionBrowserSourceMaps: false` aktif + ga ada .map di build output. (SE: Jim)
- [ ] playwright.config webServer `npm run dev` di CI → ganti `npm run build && npm start` (lebih realistis). (Lead Eng)
- [ ] Coverage: tambah test untuk lib/features.ts tier logic (entitlements) edge cases. (SE: Jim)

## 🔵 P4 — Nice-to-have (kalau waktu sisa)

- [ ] PWA manifest audit (site.webmanifest) + install prompt. (Jim)
- [ ] Security headers audit: CSP, HSTS, X-Frame-Options di vercel.json/next.config. (Lead Eng)
- [ ] Accessibility: skip-link, focus states, contrast check. (Pam)
- [ ] Email domain: perimalin SES/Resend buat notif kasbon/payslip (butuh keputusan bos). (eskalasi)

## Escalasi ke Bos (butuh akses/keputusan)

1. Vercel CLI login masih nyangkut — klik email konfirmasi dari Vercel di inbox gilankdev@gmail.com.
2. Google Search Console akses buat submit sitemap apex.lankdev.my.id.
3. Keputusan bisnis: email notification service (Resend/SES) — bayar/gratis?
4. Rotasi service_role key Supabase pasca-insiden kemarin (dashboard).
5. Aktifkan HIBP leaked-password protection di dashboard Supabase Auth.

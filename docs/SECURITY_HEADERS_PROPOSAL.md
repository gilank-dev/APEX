# Security Headers Proposal — APEX (Production-Grade)

## 1. Ringkasan Eksekutif
Dokumen ini merupakan proposal konfigurasi **Security Headers production-grade** untuk aplikasi **APEX** (Next.js 16 App Router + Supabase + Tailwind CSS + Vercel Deployment). Proposal ini dirancang untuk memberikan perlindungan *defense-in-depth* terhadap serangan XSS (Cross-Site Scripting), Clickjacking, MIME-sniffing, dan Man-in-the-Middle (MITM), tanpa mengganggu fungsionalitas utama aplikasi seperti **Absensi Selfie (Kamera)**, **Validasi Lokasi (Geolocation)**, dan **Supabase Realtime (WebSockets)**.

---

## 2. Kode Final `headers()` (Siap Tempel di `next.config.ts`)

```typescript
import type { NextConfig } from "next";
import path from "path";

// Formulasi Content Security Policy (CSP)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "*.supabase.co";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.supabase.co https://${supabaseHost};
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://${supabaseHost} wss://${supabaseHost};
  media-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, " ").trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspHeader,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), display-capture=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "idb-keyval", "goey-toast"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

---

## 3. Justifikasi & Analisis Detil Per Header

### 3.1 Content-Security-Policy (CSP)
* **`default-src 'self'`**: Membatasi semua fallback resource hanya dari origin yang sama (`https://apex.lankdev.my.id`).
* **`script-src 'self' 'unsafe-inline' 'unsafe-eval'`**:
  * `'unsafe-inline'` dibutuhkan oleh sintaks inline script React/Next.js hydration & UI library.
  * `'unsafe-eval'` dibutuhkan oleh React / Next.js Fast Refresh dan dynamic code evaluation runtime.
* **`style-src 'self' 'unsafe-inline'`**:
  * Diperlukan oleh Tailwind CSS v4 / Next.js untuk pengolahan CSS utility classes & CSS variables secara dinamik tanpa pemblokiran browser.
* **`img-src 'self' data: blob: https://*.supabase.co`**:
  * `data:` dan `blob:` dibutuhkan untuk preview gambar canvas dari selfie absensi karyawan sebelum diunggah.
  * `https://*.supabase.co` diizinkan untuk memuat avatar / foto absensi yang disimpan di Supabase Storage.
* **`connect-src 'self' https://*.supabase.co wss://*.supabase.co`**:
  * **Kritis untuk Supabase Auth & Realtime**: Mengizinkan HTTP REST API (`https://`) dan WebSocket channel (`wss://`) ke cluster Supabase. Tanpa `wss://`, fitur Realtime WebSocket akan terputus (fallback long-polling / error).
* **`frame-ancestors 'none'`**: Memastikan aplikasi APEX tidak dapat di-embed dalam `<iframe>` di situs manapun (mencegah Clickjacking).
* **`object-src 'none'` & `base-uri 'self'`**: Menutup celah eksploitasi Flash/Plugins lama dan manipulasi `<base href>`.
* **`upgrade-insecure-requests`**: Memaksa browser meng-upgrade semua HTTP sub-resource menjadi HTTPS.

### 3.2 Strict-Transport-Security (HSTS)
* **Nilai**: `max-age=63072000; includeSubDomains; preload`
* **Justifikasi**:
  * `max-age=63072000` (2 tahun) memenuhi standar minimal HSTS Preload list (Chrome/Firefox/Edge).
  * `includeSubDomains` memastikan seluruh subdomain dari `lankdev.my.id` atau `apex.lankdev.my.id` dipaksa menggunakan HTTPS.
  * `preload` mengizinkan domain didaftarkan ke HSTS Preload List global browser sehingga koneksi HTTP pertama sekalipun langsung dialihkan ke HTTPS di browser client sebelum request dikirim.

### 3.3 Permissions-Policy
* **Nilai**: `camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), display-capture=()`
* **Justifikasi**:
  * **`camera=(self)`**: **WAJIB PERMISSION HANYA UNTUK SELF ORIGIN**. Aplikasi APEX memiliki fitur utama **Selfie Absensi**. Menggunakan `camera=()` (blanket block) akan **merusak fitur absensi**. `camera=(self)` memastikan kamera hanya bisa diakses oleh dokumen APEX sendiri dan bukan iframe pihak ketiga.
  * **`geolocation=(self)`**: **WAJIB UNTUK VALIDASI LOKASI ABSENSI**. Diperlukan oleh `navigator.geolocation.getCurrentPosition()` untuk memverifikasi posisi fisik karyawan saat clock-in / clock-out.
  * **`microphone=()`, `payment=()`, `usb=()`**: Fitur yang tidak dipakai dimatikan secara ketat (`()`) untuk mengurangi *attack surface*.

### 3.4 X-Content-Type-Options
* **Nilai**: `nosniff`
* **Justifikasi**: Mencegah browser melakukan MIME-type sniffing pada response body (misalnya mengeksekusi file `.png` atau `.txt` yang berisi script jahat sebagai JavaScript).

### 3.5 X-Frame-Options
* **Nilai**: `DENY`
* **Justifikasi**: Perlindungan legacy untuk browser tua agar tidak memuat halaman APEX dalam `<iframe>`. Bekerja secara sinergis dengan CSP `frame-ancestors 'none'`.

### 3.6 Referrer-Policy
* **Nilai**: `strict-origin-when-cross-origin`
* **Justifikasi**: Mengirimkan full URL referrer untuk same-origin requests, namun hanya mengirimkan origin saja (`https://apex.lankdev.my.id`) saat melakukan navigasi cross-origin HTTPS, serta menyembunyikan referrer jika terjadi downgrade ke HTTP. Memilih keseimbangan privacy dan analytics.

---

## 4. Keputusan CSP Paling Riskan & Tricky (Riskiest CSP Decision)

### Analisis Risiko: Penggunaan `'unsafe-inline'` pada `script-src` & `style-src`
1. **Mengapa Diambil?**: Next.js App Router secara default menghasilkan beberapa inline `<script>` tags untuk bootstrapping state React (hydration data) dan inline `<style>` tags dari Tailwind CSS / CSS Modules. Jika `'unsafe-inline'` dicabut tanpa implementasi Strict Nonce di `proxy.ts`, aplikasi akan mengalami *blank screen* atau UI hancur.
2. **Potensi Vektor Serangan**: Jika terdapat celah Stored XSS di mana user input (seperti nama karyawan, catatan absensi, atau deskripsi barang) dirender secara tidak aman via `dangerouslySetInnerHTML`, attacker dapat menyisipkan `<script>maliciousCode()</script>` dan browser akan mengeksekusinya karena `script-src` mengizinkan `'unsafe-inline'`.
3. **Mitigasi Rekomendasi Jangka Panjang (Phase 2)**:
   * Menggunakan strategi Nonce via `proxy.ts` (Next.js 16 Proxy Middleware) di mana per request dibuat cryptographic nonce base64, kemudian disalurkan ke `x-nonce` header dan CSP header `'nonce-${nonce}' 'strict-dynamic'`.
   * Memastikan seluruh input user disanitasi menggunakan React JSX escaping bawaan dan tidak menggunakan `dangerouslySetInnerHTML`.

---

## 5. Kesimpulan & Langkah Selanjutnya
Proposal konfigurasi security headers ini siap untuk diimplementasikan di `next.config.ts`. Dengan konfigurasi ini, APEX terlindungi dari ancaman keamanan utama web modern, memiliki sertifikasi HSTS Preload readiness, serta menjamin fitur operasional **Absensi Selfie + GPS** dan **Supabase Realtime WebSocket** tetap berjalan 100% lancar.

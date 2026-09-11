import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Apex',
  description:
    'Syarat penggunaan Apex: paket gratis dan Pro, batas anggota, proses upgrade manual via WhatsApp, dan batasan tanggung jawab.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="text-xs font-mono uppercase tracking-widest text-primary hover:underline"
        >
          ← Kembali ke Beranda
        </Link>
        <h1 className="text-3xl font-display font-bold mt-6 mb-2 text-foreground">
          Syarat & Ketentuan
        </h1>
        <p className="text-xs text-gray-400 font-mono mb-10">
          Terakhir diperbarui: 11 September 2026
        </p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Tentang layanan</h2>
            <p>
              Apex adalah aplikasi manajemen absensi dan administrasi tim (selfie attendance,
              payroll, shift, cuti, kasbon, inventaris). Layanan disediakan oleh Gilank Putra
              Ramadhan (Lankdev), pengembang perorangan, untuk bisnis kecil di Indonesia.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Paket & pembayaran</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Paket Gratis:</strong> hingga 15 anggota, absensi selfie dan task, tanpa
                biaya, tanpa batas waktu.
              </li>
              <li>
                <strong>Paket Pro:</strong> fitur tambahan (shift, cuti, payroll, inventaris).
                Upgrade dan pembayaran saat ini diproses manual via WhatsApp dan transfer bank;
                paket aktif maksimal 1x24 jam setelah konfirmasi transfer.
              </li>
              <li>
                Berhenti berlangganan bisa kapan pun. Data kamu tetap bisa diexport, tidak
                disandera.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Kewajiban pengguna</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Kamu bertanggung jawab atas keakuratan data karyawan dan payroll yang kamu masukkan.</li>
              <li>
                Foto selfie dan data absensi hanya boleh dipakai untuk keperluan administrasi
                kepegawaian, sesuai kesepakatan kamu dengan karyawan kamu.
              </li>
              <li>Jangan memakai layanan untuk aktivitas melanggar hukum Indonesia.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Ketersediaan layanan</h2>
            <p>
              Kami berusaha menjaga layanan tetap jalan, namun tidak menjanjikan uptime 100%.
              Pemeliharaan dan gangguan pihak ketiga (hosting, jaringan) bisa terjadi. Data
              absensi kamu dicatat immutable sehingga sulit hilang karena kesalahan input, namun
              kamu tetap disarankan melakukan export berkala.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Batasan tanggung jawab</h2>
            <p>
              Apex membantu menghitung payroll dari data yang kamu masukkan, tetapi keputusan
              kepegawaian dan kepatuhan pajak/BPJS tetap tanggung jawab perusahaan kamu. Kalkulasi
              PPh21 TER disediakan sebagai alat bantu, bukan nasihat pajak resmi.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Perubahan syarat</h2>
            <p>
              Syarat bisa berubah seiring perkembangan layanan. Versi terbaru selalu ada di
              halaman ini beserta tanggal pembaruannya.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Kontak</h2>
            <p>
              Pertanyaan soal layanan, pembayaran, atau penghapusan data:{' '}
              <a href="mailto:gilankdev@gmail.com" className="text-primary hover:underline">
                gilankdev@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

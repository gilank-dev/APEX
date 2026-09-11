import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Apex',
  description:
    'Kebijakan privasi Apex: data apa yang dikumpulkan (akun, absensi selfie, lokasi absen), bagaimana disimpan, dan bagaimana kamu bisa minta hapus data.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
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
          Kebijakan Privasi
        </h1>
        <p className="text-xs text-gray-400 font-mono mb-10">
          Terakhir diperbarui: 11 September 2026
        </p>

        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Siapa kami</h2>
            <p>
              Apex dikembangkan oleh Gilank Putra Ramadhan (Lankdev), pengembang perorangan
              berdomisili di Tangerang Selatan, Indonesia. Saat ini Apex dikelola sebagai proyek
              perangkat lunak, belum merupakan badan hukum. Korespondensi:{' '}
              <a href="mailto:gilankdev@gmail.com" className="text-primary hover:underline">
                gilankdev@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Data yang kami kumpulkan</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Data akun:</strong> nama, email, nama perusahaan/workspace. Password
                disimpan ter-hash, bukan teks biasa.
              </li>
              <li>
                <strong>Data absensi:</strong> foto selfie saat absen (untuk verifikasi kehadiran),
                waktu absen, dan indikasi apakah kamu berada di radius lokasi kerja yang disetel
                admin (GPS radius). Data absensi bersifat immutable: tidak bisa diubah setelah
                tercatat.
              </li>
              <li>
                <strong>Data operasional:</strong> jadwal shift, pengajuan cuti, kasbon, task, dan
                data payroll yang kamu dan admin perusahaan kamu masukkan sendiri.
              </li>
              <li>
                <strong>Data teknis terbatas:</strong> analytics agregat (jumlah kunjungan
                halaman) tanpa identitas pribadi.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Cara penyimpanan</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Database terisolasi per perusahaan (row level security), tidak bercampur antar tenant.</li>
              <li>Seluruh lalu lintas data terenkripsi via HTTPS/TLS.</li>
              <li>Foto selfie disimpan di bucket privat, diakses lewat signed URL berumur pendek.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              Data yang TIDAK kami kumpulkan
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Kami tidak menjual data kamu ke pihak ketiga.</li>
              <li>Kami tidak memakai data absensi untuk iklan.</li>
              <li>Kami tidak mengumpulkan isi HP, kontak, atau lokasi di luar momen absen.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Hak kamu</h2>
            <p>
              Kamu bisa minta salinan atau penghapusan data perusahaan kamu kapan pun lewat{' '}
              <a href="mailto:gilankdev@gmail.com" className="text-primary hover:underline">
                gilankdev@gmail.com
              </a>
              . Berhenti berlangganan tidak mengunci data: kamu tetap bisa export CSV/JSON
              sebelum workspace dinonaktifkan.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Perubahan kebijakan</h2>
            <p>
              Kalau kebijakan ini berubah, tanggal pembaruan di atas akan diganti dan perubahan
              besar akan diberitakan ke email admin workspace.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}

export interface Feature {
  id: string
  name: string
  description: string
  kpis: { label: string; value: string }[]
  actionLabel: string
  actionSuccessMessage: string
  placeholderText?: string
}

// Catatan penting: modul "Fitur Industri" di bawah adalah widget demo/preview
// interaktif (data tersimpan lokal di browser). KPI yang tampil adalah contoh
// format, bukan data operasional perusahaan Anda. Untuk fitur inti (absensi,
// payroll, shift, cuti, inventaris), gunakan modul utama di sidebar.

export const CATEGORY_FEATURES: Record<string, Feature[]> = {
  corporate: [
    {
      id: 'leave',
      name: 'Cuti & Izin',
      description: 'Pengajuan cuti/izin/sakit karyawan dengan persetujuan admin dan catatan lengkap',
      kpis: [
        { label: 'Pengajuan', value: 'Real-time' },
        { label: 'Persetujuan', value: 'Bertingkat' },
        { label: 'Riwayat', value: 'Tersimpan' }
      ],
      actionLabel: 'Kelola Pengajuan Cuti',
      actionSuccessMessage: 'Pengajuan cuti berhasil diproses.'
    },
    {
      id: 'payroll-engine',
      name: 'Payroll Engine',
      description: 'Kompilasi gaji, tunjangan, dan potongan otomatis berbasis rekap kehadiran bulanan karyawan',
      kpis: [
        { label: 'Perhitungan', value: 'Otomatis' },
        { label: 'Slip Gaji', value: 'Per Karyawan' },
        { label: 'Ekspor', value: 'CSV' }
      ],
      actionLabel: 'Jalankan Perhitungan Gaji',
      actionSuccessMessage: 'Perhitungan gaji selesai. Slip gaji siap ditinjau.'
    },
    {
      id: 'live-attendance-selfie',
      name: 'Live Attendance Selfie',
      description: 'Absensi karyawan dengan verifikasi selfie kamera depan, ringan dan menjaga privasi',
      kpis: [
        { label: 'Verifikasi', value: 'Selfie' },
        { label: 'Absen', value: '10 Detik' },
        { label: 'Anti Titip', value: 'Ya' }
      ],
      actionLabel: 'Verifikasi Selfie & Absen',
      actionSuccessMessage: 'Verifikasi selfie berhasil. Kehadiran tercatat.'
    },
    {
      id: 'multi-tier-approval',
      name: 'Alur Persetujuan Bertingkat',
      description: 'Alur persetujuan dokumen berjenjang (Staff → Manager → Direksi) dengan keamanan RLS',
      kpis: [
        { label: 'Alur', value: 'Bertingkat' },
        { label: 'Keamanan', value: 'RLS' },
        { label: 'Riwayat', value: 'Lengkap' }
      ],
      actionLabel: 'Proses Antrean Persetujuan',
      actionSuccessMessage: 'Dokumen disetujui dan diteruskan ke jenjang berikutnya.'
    }
  ],
  school: [
    {
      id: 'student-database',
      name: 'Database Siswa',
      description: 'Penyimpanan terpusat ID siswa, data diri, riwayat nilai, dan kontak orang tua dengan pencarian cepat',
      kpis: [
        { label: 'Pencarian', value: 'Cepat' },
        { label: 'Data Siswa', value: 'Terpusat' },
        { label: 'Kontak Ortu', value: 'Terhubung' }
      ],
      actionLabel: 'Cari Database Siswa',
      actionSuccessMessage: 'Pencarian database siswa diperbarui.',
      placeholderText: 'Nama siswa atau NIS...'
    },
    {
      id: 'tuition-billing',
      name: 'Tagihan SPP',
      description: 'Catat pembayaran SPP tiap bulan dengan status lunas/belum dan riwayat lengkap',
      kpis: [
        { label: 'Tagihan', value: 'Bulanan' },
        { label: 'Status', value: 'Lunas / Belum' },
        { label: 'Riwayat', value: 'Per Siswa' }
      ],
      actionLabel: 'Catat Pembayaran SPP',
      actionSuccessMessage: 'Pembayaran SPP tercatat.'
    },
    {
      id: 'grade-book-system',
      name: 'Buku Nilai',
      description: 'Input nilai per kelas dengan penyimpanan otomatis anti hilang',
      kpis: [
        { label: 'Input', value: 'Per Kelas' },
        { label: 'Auto-save', value: 'Aktif' },
        { label: 'Rapor', value: 'Siap Cetak' }
      ],
      actionLabel: 'Hitung Nilai Rapor',
      actionSuccessMessage: 'Nilai rapor terhitung dan tersimpan otomatis.'
    },
    {
      id: 'teacher-scheduling',
      name: 'Jadwal Mengajar',
      description: 'Susun jadwal mengajar guru dengan pengecekan bentrok otomatis',
      kpis: [
        { label: 'Bentrok', value: 'Otomatis Dicek' },
        { label: 'Jadwal', value: 'Mingguan' },
        { label: 'Tampilan', value: 'Grid' }
      ],
      actionLabel: 'Validasi Jadwal',
      actionSuccessMessage: 'Pengecekan jadwal selesai: tidak ada bentrok.'
    }
  ],
  fnb: [
    {
      id: 'cash-drawer-audit',
      name: 'Audit Kasir',
      description: 'Rekonsiliasi kasir di akhir shift dengan input saldo untuk mencegah bias',
      kpis: [
        { label: 'Rekonsiliasi', value: 'Per Shift' },
        { label: 'Selisih Kas', value: 'Tercatat' },
        { label: 'Riwayat', value: 'Lengkap' }
      ],
      actionLabel: 'Kirim Log Audit Kas',
      actionSuccessMessage: 'Log audit kasir tersimpan.'
    },
    {
      id: 'fifo-inventory',
      name: 'Inventaris FIFO (Bahan Baku)',
      description: 'Lacak kedaluwarsa bahan baku berdasarkan urutan masuk (First In, First Out)',
      kpis: [
        { label: 'Bahan', value: 'Per Batch' },
        { label: 'Kedaluwarsa', value: 'Dipantau' },
        { label: 'Stok Kritis', value: 'Peringatan' }
      ],
      actionLabel: 'Pindai Batch Kedaluwarsa',
      actionSuccessMessage: 'Data inventaris FIFO diperbarui.'
    },
    {
      id: 'dynamic-roster',
      name: 'Roster Dinamis',
      description: 'Pembagi jadwal shift (Pagi, Siang, Malam) dengan tampilan responsif untuk tablet',
      kpis: [
        { label: 'Shift', value: '3 Rentang' },
        { label: 'Drag & Drop', value: 'Ya' },
        { label: 'Perangkat', value: 'Tablet' }
      ],
      actionLabel: 'Simpan Jadwal Shift',
      actionSuccessMessage: 'Jadwal shift mingguan tersimpan.'
    }
  ],
  retail: [
    {
      id: 'live-sku-tracking',
      name: 'Pelacakan SKU',
      description: 'Pantau level stok barang masuk dan keluar secara real-time',
      kpis: [
        { label: 'Stok', value: 'Real-time' },
        { label: 'Barang', value: 'Per SKU' },
        { label: 'Stok Menipis', value: 'Peringatan' }
      ],
      actionLabel: 'Aktifkan Pelacakan',
      actionSuccessMessage: 'Pelacakan SKU aktif.'
    },
    {
      id: 'stock-opname',
      name: 'Stock Opname (Audit)',
      description: 'Penghitungan stok offline-first untuk gudang dengan sinyal Wi-Fi lemah',
      kpis: [
        { label: 'Mode', value: 'Offline-first' },
        { label: 'Sinkronisasi', value: 'Otomatis' },
        { label: 'Selisih', value: 'Tercatat' }
      ],
      actionLabel: 'Mulai Sesi Stock Opname',
      actionSuccessMessage: 'Hasil hitung stok tersinkron.'
    },
    {
      id: 'cashier-shift-handover',
      name: 'Serah Terima Kasir',
      description: 'Tutup sesi kasir dengan catatan serah terima yang jelas untuk shift berikutnya',
      kpis: [
        { label: 'Sesi', value: 'Tertutup' },
        { label: 'Serah Terima', value: 'Tercatat' },
        { label: 'Keamanan', value: 'Rapi' }
      ],
      actionLabel: 'Tutup Sesi Kasir',
      actionSuccessMessage: 'Sesi kasir ditutup dan serah terima tercatat.'
    }
  ],
  clinic: [
    {
      id: 'lite-emr',
      name: 'Rekam Medis Ringan',
      description: 'Catat kunjungan pasien, diagnosis, dan tindakan dengan pencarian cepat',
      kpis: [
        { label: 'Kunjungan', value: 'Tercatat' },
        { label: 'Pencarian', value: 'Cepat' },
        { label: 'Privasi', value: 'Isolasi Data' }
      ],
      actionLabel: 'Buka Rekam Medis',
      actionSuccessMessage: 'Rekam medis diperbarui.'
    },
    {
      id: 'prescription-tracker',
      name: 'Pelacak Resep',
      description: 'Pantau resep yang diberikan dan status pemenuhannya',
      kpis: [
        { label: 'Resep', value: 'Terpantau' },
        { label: 'Status', value: 'Dipenuhi / Menunggu' },
        { label: 'Riwayat', value: 'Per Pasien' }
      ],
      actionLabel: 'Perbarui Status Resep',
      actionSuccessMessage: 'Status resep diperbarui.'
    },
    {
      id: 'patient-queue-system',
      name: 'Antrean Pasien',
      description: 'Kelola antrean pasien dengan nomor urut dan estimasi tunggu',
      kpis: [
        { label: 'Antrean', value: 'Real-time' },
        { label: 'Nomor Urut', value: 'Otomatis' },
        { label: 'Estimasi', value: 'Tampil' }
      ],
      actionLabel: 'Panggil Pasien Berikutnya',
      actionSuccessMessage: 'Pasien berikutnya dipanggil.'
    }
  ],
  ngo: [
    {
      id: 'fund-allocation-tracker',
      name: 'Pelacak Alokasi Dana',
      description: 'Catat alokasi dana program dengan status pencairan per kegiatan',
      kpis: [
        { label: 'Dana', value: 'Per Program' },
        { label: 'Pencairan', value: 'Tercatat' },
        { label: 'Laporan', value: 'Ringkas' }
      ],
      actionLabel: 'Catat Alokasi Dana',
      actionSuccessMessage: 'Alokasi dana tercatat.'
    },
    { id: 'donor-crm', name: 'CRM Donatur', description: 'Kelola data donatur dan riwayat kontribusi', kpis: [
        { label: 'Donatur', value: 'Terdata' },
        { label: 'Kontribusi', value: 'Per Orang' },
        { label: 'Kontak', value: 'Tersimpan' }
      ],
      actionLabel: 'Tambah Donatur',
      actionSuccessMessage: 'Donatur baru tercatat.'
    },
    {
      id: 'beneficiary-database',
      name: 'Database Penerima Manfaat',
      description: 'Data penerima manfaat program dengan status verifikasi',
      kpis: [
        { label: 'Penerima', value: 'Terdata' },
        { label: 'Verifikasi', value: 'Tercatat' },
        { label: 'Program', value: 'Terhubung' }
      ],
      actionLabel: 'Tambah Penerima',
      actionSuccessMessage: 'Penerima manfaat tercatat.'
    }
  ],
}

import React, { useMemo, useState } from 'react';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'perencanaan', label: 'Perencanaan Audit' },
  { key: 'pelaksanaan', label: 'Pelaksanaan Audit' },
  { key: 'temuan', label: 'Temuan Audit' },
  { key: 'laporan', label: 'Laporan' },
  { key: 'dokumen', label: 'Dokumen' },
  { key: 'tindakLanjut', label: 'Tindak Lanjut' }
  // Admin pages intentionally excluded: manajemen-user, pengaturan
];

function Section({ title, steps }) {
  return (
    <div>
      <h3 style={{ margin: '16px 0 8px' }}>{title}</h3>
      <ol style={{ paddingLeft: 20, margin: 0 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ marginBottom: 8 }}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

export default function Panduan() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const content = useMemo(() => ({
    dashboard: (
      <div>
        <Section title="Mulai dari Dashboard" steps={[
          'Buka aplikasi dan login menggunakan akun Anda.',
          'Periksa ringkasan pada kartu statistik (Total Audit, Temuan, Selesai, Dalam Proses).',
          'Gunakan Aksi Cepat untuk menuju halaman yang sering dipakai (opsional).',
          'Klik menu di sidebar untuk berpindah halaman.'
        ]} />
        <Section title="Navigasi Utama" steps={[
          'Dashboard: Ringkasan aktivitas dan statistik.',
          'Perencanaan Audit: Susun rencana sebelum proses audit.',
          'Pelaksanaan Audit: Kelola dan pantau audit yang berjalan.',
          'Temuan Audit: Catat dan kategorikan temuan.',
          'Laporan: Susun dan unduh laporan audit.',
          'Dokumen: Kelola file pendukung audit.',
          'Tindak Lanjut: Monitor progres perbaikan atas temuan.'
        ]} />
      </div>
    ),
    perencanaan: (
      <div>
        <Section title="Menyusun Perencanaan Audit" steps={[
          'Buka menu Perencanaan Audit dari sidebar.',
          'Klik tombol Tambah/Baru untuk membuat rencana.',
          'Isi scope, tujuan, tim, dan jadwal audit.',
          'Simpan rencana untuk digunakan pada tahap pelaksanaan.'
        ]} />
      </div>
    ),
    pelaksanaan: (
      <div>
        <Section title="Mengelola Pelaksanaan Audit" steps={[
          'Masuk ke menu Pelaksanaan Audit.',
          'Tambahkan audit baru atau pilih audit yang sedang berjalan.',
          'Perbarui progres persentase dan status secara berkala.',
          'Tetapkan penanggung jawab dan atur jadwal kegiatan.'
        ]} />
      </div>
    ),
    temuan: (
      <div>
        <Section title="Mencatat Temuan Audit" steps={[
          'Buka menu Temuan Audit.',
          'Klik Tambah Temuan dan isi detail (deskripsi, lokasi, bukti).',
          'Pilih tingkat keparahan (Low/Medium/High/Critical).',
          'Simpan dan, bila perlu, tetapkan tindak lanjut.'
        ]} />
      </div>
    ),
    laporan: (
      <div>
        <Section title="Menyusun dan Mengunduh Laporan" steps={[
          'Masuk ke menu Laporan.',
          'Pilih jenis dan periode laporan yang diinginkan.',
          'Klik Generate untuk menyusun laporan.',
          'Unduh hasil laporan (mis. PDF/Excel) untuk distribusi.'
        ]} />
      </div>
    ),
    dokumen: (
      <div>
        <Section title="Mengelola Dokumen Audit" steps={[
          'Buka menu Dokumen.',
          'Klik Upload Dokumen dan pilih file yang relevan.',
          'Lengkapi metadata (kategori, deskripsi) lalu unggah.',
          'Gunakan kolom pencarian/daftar untuk mengunduh kembali file.'
        ]} />
      </div>
    ),
    tindakLanjut: (
      <div>
        <Section title="Menangani Tindak Lanjut Temuan" steps={[
          'Masuk ke menu Tindak Lanjut.',
          'Pilih temuan yang memerlukan aksi perbaikan.',
          'Tetapkan penanggung jawab dan target waktu penyelesaian.',
          'Monitor progres dan perbarui status hingga selesai.'
        ]} />
      </div>
    )
  }), []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: 16
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 12px',
                border: '1px solid ' + (isActive ? '#2563eb' : '#e5e7eb'),
                background: isActive ? '#eff6ff' : '#fff',
                color: '#111827',
                borderBottomColor: isActive ? '#eff6ff' : '#e5e7eb',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {content[activeTab]}
      </div>
    </div>
  );
}






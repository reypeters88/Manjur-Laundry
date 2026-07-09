# Rencana Implementasi: Webapp Kas & Laporan Keuangan "Manjur Laundry"

Aplikasi Webapp Kas, Laporan Keuangan, dan Manajemen Laundry modern untuk **Manjur Laundry** ("*Bersih, Harum, Cepat, & Manjur!*"). Aplikasi ini dibangun sebagai Single Page Application (SPA) interaktif yang memadukan estetika modern (warna Biru & Hijau/Emerald, Glassmorphism, animasi halus) dengan fungsionalitas operasional laundry yang lengkap.

## User Review Required

> [!IMPORTANT]
> **Pilihan Mode Penyimpanan Data (Hybrid Data Engine)**:
> Aplikasi akan dilengkapi dengan sistem database hybrid:
> 1. **Mode LocalStorage (Langsung Aktif)**: Secara default, aplikasi dapat langsung dijalankan di browser mana pun tanpa konfigurasi server/database. Data sampel awal (pelanggan, transaksi, inventory, dan kas) akan disediakan otomatis sehingga Anda bisa langsung menguji semua fitur.
> 2. **Mode Google Apps Script & Google Sheets**: Kami juga menyediakan file backend `Code.gs` beserta panduan skema Google Sheets, sehingga Anda dapat mendepoy aplikasi ini ke Google Apps Script sebagai sistem cloud multi-user yang terintegrasi secara real-time.

> [!TIP]
> **Cetak Nota Thermal Blueprint Semua Ukuran**:
> Sistem cetak nota dirancang secara khusus dengan pengatur layout dinamis untuk printer thermal **58mm** (mini thermal / Bluetooth mobile printer), **80mm** (printer kasir standar), serta format **A4/Letter** untuk invoice resmi kantor.

## Open Questions

1. **Format Mata Uang & Angka**: Secara default, semua kalkulasi keuangan akan menggunakan format Rupiah Indonesia (misal: `Rp 15.000`, `Rp 1.250.000`). Apakah ada format khusus lain yang diinginkan?
2. **Kategori Layanan Default**: Kami menyiapkan layanan default seperti *Cuci Kiloan Reguler (2 Hari)*, *Cuci Kiloan Express (6 Jam)*, *Cuci Satuan Kemeja/Jas*, *Cuci Karpet*, dan *Setrika Saja*. Apakah ada layanan khusus Manjur Laundry yang perlu dimasukkan sejak awal?

## Proposed Changes

Semua file proyek akan disimpan di workspace aktif: `g:\My Drive\Apiksi\Projek 1`.

### Webapp SPA & Styling Engine

#### [NEW] [index.html](file:///g:/My%20Drive/Apiksi/Projek%201/index.html)
Aplikasi SPA lengkap dalam satu file dengan struktur profesional:
- **Desain Modern Biru & Hijau**: Menggunakan Tailwind CSS interaktif dengan palet warna Primary Blue (`#0284c7` / `#1e3a8a`) dan Accent Green (`#10b981` / `#059669`), efek kaca (glassmorphism), card shadow modern, dan animasi transisi halaman yang halus.
- **Header & Navigasi**: Logo & Branding **Manjur Laundry**, sistem navigasi tab interaktif, indikator jam real-time, dan **Role Switcher Simulator** (Owner, Kasir, Produksi) untuk pengujian hak akses secara instan.
- **Modul 1: Dashboard & Analitik Executive**:
  - KPI Cards: Omzet Hari Ini, Pendapatan Bulan Ini, Pesanan Dalam Proses, Peringatan Stok Menipis, Laba Bersih.
  - Chart Interaktif (Chart.js): Grafik Tren Pendapatan 7 & 30 Hari, serta Grafik Komposisi Layanan Terlaris.
- **Modul 2: POS Kasir & Manajemen Transaksi**:
  - Pilihan Pelanggan dengan deteksi otomatis status member (*Reguler*, *Silver 5% Off*, *Gold 10% Off*).
  - Pilihan Layanan (Kiloan, Satuan, Karpet, Express) dengan penghitungan otomatis harga, berat/qty, dan diskon.
  - Kalkulator kembalian otomatis & pemilihan metode pembayaran (Tunai, QRIS, Transfer Bank).
  - Kanban / Tabel Pemantauan Status Cucian (`Antrean` -> `Dicuci` -> `Dikeringkan` -> `Disetrika` -> `Selesai` -> `Diambil`) dan status pembayaran (`Lunas` / `Belum Lunas`).
  - Tombol **Kirim Notifikasi WhatsApp** (otomatis membuat link pesan tagihan atau info cucian selesai ke WA pelanggan).
- **Modul 3: Sistem Print Nota Thermal (58mm, 80mm, A4)**:
  - Jendela preview struk digital dengan tombol pengubah ukuran layout kertas:
    - **Mode 58mm**: Layout ringkas, font padat, cocok untuk printer thermal portable/Bluetooth.
    - **Mode 80mm**: Layout standar kasir toko, informasi lebih detail dengan rincian poin/diskon.
    - **Mode A4 Invoice**: Layout faktur resmi berlogo untuk pelanggan korporat/instansi.
  - CSS `@media print` khusus yang mengisolasi struk dari elemen UI lain saat diprint.
- **Modul 4: Manajemen Keuangan & Arus Kas**:
  - Jurnal Arus Kas (Pemasukan & Pengeluaran) dengan filter tanggal interaktif.
  - **Laporan Laba Rugi (Income Statement)**: Rekapitulasi otomatis Pendapatan Operasional dikurangi Pengeluaran Operasional (Gaji, Listrik, Sewa, Restock Bahan Baku).
  - Ekspor Laporan Keuangan ke Excel (`.xlsx`) menggunakan SheetJS.
- **Modul 5: Manajemen Inventory (Bahan Baku Laundry)**:
  - Daftar barang (Detergen Cair, Softener, Parfum Premium, Plastik Packing, Gas LPG, Tagging Pin, dll.) dengan indikator warna stok (Aman / Menipis).
  - **Fitur Restock Terintegrasi**: Saat melakukan penambahan stok (Restock), sistem akan menambah jumlah barang DI INVENTORY sekaligus mencatat biaya pembelian DI MANAJEMEN KEUANGAN sebagai pengeluaran secara otomatis!
- **Modul 6: Database Pelanggan & Membership**:
  - Data kontak, riwayat transaksi, dan akumulasi berat cucian untuk kenaikan level member otomatis.
- **Modul 7: Manajemen Pengguna (User & Role Management)**:
  - Khusus Owner: Tambah, edit, dan hapus akun staf (Kasir, Produksi) dengan pembatasan hak akses (RBAC).

### Backend Script & Dokumentasi

#### [NEW] [Code.gs](file:///g:/My%20Drive/Apiksi/Projek%201/Code.gs)
Skrip backend Google Apps Script (GAS) untuk integrasi dengan Google Sheets:
- Fungsi `doGet(e)` untuk menyajikan web app.
- Fungsi `doPost(e)` dan API handlers (`getInitialData`, `saveTransaction`, `updateOrderStatus`, `restockItem`, `addExpense`, `manageUser`) yang melakukan operasi baca/tulis ke lembar spreadsheet.

#### [NEW] [PRD_Manjur_Laundry.md](file:///g:/My%20Drive/Apiksi/Projek%201/PRD_Manjur_Laundry.md)
Dokumen Product Requirements & User Manual:
- Panduan instalasi dan penggunaan aplikasi secara offline (LocalStorage) maupun cloud (GAS + Google Sheets).
- Skema tabel spreadsheet (`Users`, `Customers`, `Transactions`, `Inventory`, `Finances`).
- Petunjuk cetak nota thermal pada berbagai jenis printer blueprint/thermal.

## Verification Plan

### Automated / Browser Testing
- Memeriksa struktur DOM, konsistensi kelas styling Tailwind CSS (palet biru-hijau `#0284c7`, `#10b981`), dan tidak ada error pada console browser.
- Memvalidasi logika kalkulasi total harga, diskon member, kembalian kasir, dan integrasi otomatis pengeluaran saat restock inventory.

### Manual Verification
- Membuka `index.html` langsung di browser untuk memverifikasi tampilan visual yang modern dan responsif.
- Menguji alur POS Kasir dari pembuatan pesanan baru hingga preview struk nota thermal.
- Menguji tombol navigasi ukuran struk (**58mm**, **80mm**, **A4**) dan memverifikasi layout cetak melalui fungsi Print Preview browser.
- Menguji pengalihan peran (Role Switcher) untuk memastikan pembatasan akses pada menu Keuangan dan Manajemen User berfungsi sesuai aturan RBAC.

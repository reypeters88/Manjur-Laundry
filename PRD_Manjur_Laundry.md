# Product Requirements Document (PRD) & User Manual
**Project Name**: Manjur Laundry - Webapp Kas & Laporan Keuangan
**Branding**: "Bersih, Harum, Cepat, & Manjur!"
**Version**: 1.0 (Hybrid LocalStorage & Google Apps Script Engine)
**Date**: Juli 2026

---

## 1. Pendahuluan
**Manjur Laundry** adalah aplikasi Single Page Application (SPA) modern yang dirancang untuk mengelola seluruh aspek operasional usaha laundry, mulai dari pencatatan kasir (POS), manajemen keuangan (arus kas & laba rugi), pemantauan inventaris bahan baku, hingga database pelanggan dan keanggotaan (membership). 

Aplikasi ini mengusung antarmuka visual kelas atas (*vibrant blue & emerald green, glassmorphism*) serta sistem cetak nota blueprint thermal yang adaptif terhadap berbagai ukuran kertas printer kasir maupun printer mobile Bluetooth.

---

## 2. Keunggulan & Arsitektur Data (Hybrid Data Engine)
Aplikasi dibekali dengan mesin penyimpanan data ganda untuk fleksibilitas maksimal:
1. **Mode Offline/Instant (LocalStorage)**: Secara default, aplikasi langsung aktif dan menyimpan data di memori browser Anda. Data sampel awal (pelanggan, produk, persediaan, arus kas) disiapkan secara otomatis.
2. **Mode Cloud Multi-User (Google Apps Script & Sheets)**: Anda dapat menghubungkan aplikasi ke spreadsheet Google Sheets dengan menyalin skrip `Code.gs` ke deployment web app Google Apps Script.

---

## 3. Fitur Utama & Modul Sistem

### A. Dashboard Executive & Analitik Keuangan
- **KPI Real-time**: Menampilkan total omzet hari ini, pendapatan bulanan, jumlah pesanan aktif (diproses), alert stok menipis, dan laba bersih.
- **Visualisasi Grafik (Chart.js)**:
  - Tren Pendapatan vs Pengeluaran (7 Hari / 30 Hari Terakhir).
  - Distribusi Layanan Terlaris (Cuci Kiloan vs Satuan vs Karpet vs Express).

### B. POS Kasir & Manajemen Transaksi
- **Pencatatan Cepat**: Pilihan pelanggan eksisting atau pembuatan pelanggan baru dalam 1 klik.
- **Kalkulasi Otomatis**: Menghitung berat/qty dikalikan harga layanan, otomatis mendeteksi diskon member (*Silver 5%*, *Gold 10%*), dan menghitung kembalian uang.
- **Kanban & Status Tracker**: Melacak progres pesanan mulai dari `Antrean`, `Dicuci`, `Dikeringkan`, `Disetrika`, `Selesai`, hingga `Diambil`.
- **Integrasi WhatsApp**: Tombol instan untuk mengirimkan pesan tagihan atau info pesanan selesai langsung ke WhatsApp pelanggan tanpa menyimpan nomor di kontak HP.

### C. Cetak Nota Thermal Blueprint Semua Ukuran
Fitur cetak struk mutakhir yang mendukng tiga ukuran kertas cetak standar:
- **58mm Thermal Receipt**: Untuk printer bluetooth portable / mini thermal printer (lebar 58mm). Desain ringkas dan hemat kertas.
- **80mm Thermal Receipt**: Untuk printer kasir desktop standar (lebar 80mm). Menampilkan rincian diskon dan poin lebih lengkap.
- **A4 / Letter Invoice**: Untuk faktur resmi berukuran besar bagi klien korporat, hotel, atau instansi.

### D. Manajemen Keuangan & Arus Kas
- **Jurnal Umum**: Pencatatan Pemasukan (otomatis dari kasir) & Pengeluaran (Gaji, Listrik, Sewa, dll.).
- **Laporan Laba Rugi (Income Statement)**: Rekapitulasi otomatis Total Pendapatan dikurangi Total Biaya Operasional untuk menghasilkan Laba Bersih.
- **Export Excel**: Tombol unduh laporan ke format Excel (`.xlsx`) dalam 1 klik.

### E. Manajemen Inventory (Bahan Baku)
- **Monitoring Stok**: Katalog bahan baku (Detergen Cair, Pewangi, Plastik, Gas LPG, dll.) disertai batas stok minimum.
- **Restock Otomatis Terintegrasi**: Saat Anda melakukan penambahan stok (Restock) di modul inventaris, sistem akan menambahkan kuantitas barang **sekaligus mencatat pengeluaran pembelian ke dalam Manajemen Keuangan** secara otomatis!

### F. Database Pelanggan & Membership Tiering
- **Level Keanggotaan Otomatis**:
  - **Reguler**: Total cucian di bawah 20 kg.
  - **Silver Member**: Total cucian mencapai 20 kg (Diskon otomatis 5% di Kasir).
  - **Gold Member**: Total cucian mencapai 50 kg (Diskon otomatis 10% & Layanan Prioritas).

### G. Manajemen Pengguna & Keamanan Password (RBAC Enhancements & Login Security)
- **Keamanan Wajib Login (Required Login Screen)**: Saat pertama kali membuka aplikasi di browser, sistem wajib menagih **Username** dan **Password** pada layar proteksi khusus (Login Screen). Utama/Demo Akun:
  - **👑 Owner**: Username: `owner`, Password: `admin123`
  - **💻 Kasir**: Username: `kasir`, Password: `kasir123`
  - **🧺 Produksi**: Username: `produksi`, Password: `prod123`
- **Tombol Keluar / Logout**: Tersedia tombol logout merah di header untuk menutup sesi kerja secara aman dan mengembalikan aplikasi ke layar kunci Login.
- **Role Owner (Full Akses & Kontrol Eksekutif)**:
  - **Manajemen User & Ubah Password (`Ubah & Buat Password User`)**: Owner memiliki wewenang penuh pada menu "Manajemen User & Password" untuk menambah akun staf baru, mengubah nama staf, mengganti username, dan **mengubah password login user** secara langsung dengan tombol **✏️ Edit & Ubah Password**.
  - **Manajemen Layanan & Harga (`Edit Harga & Pelayanan`)**: Owner dapat menambah layanan baru, mengubah nama paket cucian, mengedit harga per Kg/Pcs/Meter, serta mengatur kategori dan ikon secara real-time.
  - **Manajemen Inventory (`Edit Nama & Detail Inventory`)**: Owner dapat mengubah nama bahan baku, harga satuan beli, dan batas stok minimum peringatan.
  - **Koreksi Transaksi (`Edit Transaksi`)**: Owner berwenang mengoreksi data pesanan kasir yang sudah tersimpan (koreksi nama pelanggan, jenis layanan, kuantitas, total biaya, nominal dibayar, hingga status pembayaran).
- **Role Kasir**: Akses ke POS Transaksi, Pelanggan, dan monitoring Inventaris (tanpa izin edit harga/item).
- **Role Produksi**: Hanya dapat melihat dan memperbarui status progres pengerjaan cucian (`Antrean` -> `Dicuci` -> `Disetrika` -> `Selesai`).

### H. Profile Perusahaan & Outlet (Pengaturan Identitas Usaha & Struk)
- **Menu Profile di Dalam Akun**: Tersedia menu **Profile Perusahaan** di dalam menu dropdown **Akun** dan Pusat Akun (Akun Hub).
- **Pengaturan Lengkap**: Pengguna dapat mengedit **Nama Perusahaan/Usaha**, **Alamat Lengkap Outlet**, **Nomor Kontak / WhatsApp**, dan **Slogan/Tagline**.
- **Live Preview Real-Time**: Dilengkapi pratinjau langsung nota cetak thermal & blueprint yang memperlihatkan bagaimana identitas perusahaan baru terlihat pada kop struk.
- **Penerapan Global & Otomatis**: Perubahan profil disimpan secara persisten di `localStorage` (`appState.companyProfile`) dan langsung diterapkan pada Header Aplikasi, Layar Login, serta seluruh hasil cetakan Nota Struk.

---

## 4. Skema Database Google Sheets (Opsional)
Jika Anda ingin menghubungkan aplikasi ke Google Sheets, buat 6 sheet/tab berikut:

| Nama Tab | Daftar Kolom |
|---|---|
| `Users` | `id`, `name`, `username`, `password`, `role` |
| `Customers` | `id`, `name`, `phone`, `address`, `membership`, `total_weight` |
| `Services` | `id`, `name`, `price`, `unit`, `icon`, `category` |
| `Transactions` | `id`, `customerId`, `customerName`, `serviceId`, `serviceName`, `qty`, `isExpress`, `discount`, `totalCost`, `paidAmount`, `status`, `paymentStatus`, `paymentMethod`, `date`, `notes` |
| `Inventory` | `id`, `itemName`, `category`, `stock`, `unit`, `minStock`, `unitPrice`, `lastRestock` |
| `Finances` | `id`, `type`, `category`, `description`, `amount`, `date` |

---

## 5. Panduan Penggunaan Singkat
1. **Buka Aplikasi**: Klik ganda file `index.html` untuk membuka aplikasi di browser komputer, tablet, atau smartphone Anda.
2. **Instal Aplikasi di HP / Android**: Klik tombol **"📱 Pasang di HP"** di header navigasi atau di layar login, atau ketuk menu **Titik Tiga (⋮)** di Google Chrome Android lalu pilih **"Tambahkan ke Layar Utama" (Add to Home Screen)**. Aplikasi akan terpasang dengan logo resmi **Manjur Laundry** dan bisa dibuka secara *full screen*.
3. **Uji Coba Hak Akses**: Gunakan drop-down **"Simulasikan Role"** di pojok kanan atas untuk melihat tampilan sebagai Owner, Kasir, atau staf Produksi.
4. **Membuat Transaksi Baru**: Buka tab **POS Kasir**, pilih pelanggan dan layanan, masukkan berat/jumlah item, klik **"Simpan & Cetak Nota"**.
5. **Mencetak Struk**: Pada jendela yang muncul, pilih tombol ukuran struk (`58mm`, `80mm`, atau `A4`), lalu klik **"Cetak Nota Sekarang"**.

---

## 6. Spesifikasi PWA (Progressive Web App) & Mobile Android
- **Manifest (`manifest.json`)**: Mengatur nama aplikasi (`Manjur Laundry`), warna tema (`#0284c7`), dan ikon resmi (`logo_manjur.png`).
- **Service Worker (`sw.js`)**: Memungkinkan aplikasi berjalan secara offline dan disimpan ke dalam cache memori HP Android maupun desktop.
- **Dukungan APK Mandiri**: Dapat dikonversi menjadi file `.apk` Android menggunakan generator PWA seperti PWABuilder.

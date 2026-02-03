# Alur & Tampilan UI: Laporan & Settlement Kasir

Dokumen ini menjelaskan **alur** dan **tampilan** (wireframe) halaman Laporan & Settlement untuk kasir, agar bisa dipahami sebelum implementasi.

---

## 1. Akses ke halaman

- Kasir membuka **Laporan & Settlement** dari dashboard kasir (misalnya: tombol "Laporan & Settlement" atau link di menu/nav).
- Route contoh: `/kasir/laporan` (bisa diganti sesuai kesepakatan).

---

## 2. Layout halaman (dari atas ke bawah)

```
+------------------------------------------------------------------+
|  HEADER (sama seperti dashboard kasir)                           |
|  [Logo]                    [Tanggal · Waktu]    [User dropdown]   |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  Breadcrumb / Navigasi                                           |
|  [← Kembali ke Dashboard]                                        |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  Judul Halaman                                                    |
|  Laporan & Settlement                                             |
|  (subtitle: Laporan harian dan tutup kasir)                       |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  PILIH PERIODE                                                    |
|  Tanggal: [____30/01/2026____]  [Tampilkan]                       |
|  (default: hari ini)                                              |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  BAGIAN 1: LAPORAN HARIAN                                         |
|  (ringkasan transaksi yang selesai & sudah dibayar di tanggal itu)|
|                                                                   |
|  +-------------+  +-------------+  +-------------+                 |
|  | Total       |  | Total       |  | Tunai       |                 |
|  | Transaksi   |  | Penjualan   |  | (Rp)        |                 |
|  |    12       |  | Rp 450.000  |  | Rp 280.000  |                 |
|  +-------------+  +-------------+  +-------------+                 |
|  +-------------+  +-------------+                                 |
|  | Non-Tunai   |  | Diskon      |  (optional: Total PPN)          |
|  | (Rp)        |  | (Rp)        |                                  |
|  | Rp 170.000  |  | Rp 20.000   |                                  |
|  +-------------+  +-------------+                                 |
|                                                                   |
|  (Optional) Tabel detail transaksi hari ini:                      |
|  +------+----------+-------------+-----------+-----------+         |
|  | No   | Waktu    | No. Pesanan | Pembayaran| Total     |         |
|  +------+----------+-------------+-----------+-----------+         |
|  | 1    | 08.15    | #ABC123     | Tunai     | Rp 35.000 |         |
|  | 2    | 09.22    | #DEF456     | Non-Tunai | Rp 42.500 |         |
|  | ...  | ...      | ...         | ...       | ...       |         |
|  +------+----------+-------------+-----------+-----------+         |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  BAGIAN 2: SETTLEMENT (Tutup Kasir)                               |
|  (rekonsiliasi uang tunai di laci)                                |
|                                                                   |
|  Uang tunai yang seharusnya (dari transaksi tunai hari ini):     |
|  [  Rp 280.000  ]  (read-only, dari sistem)                      |
|                                                                   |
|  Uang tunai yang diserahkan kasir:                                |
|  [  ______________  ]  (input kasir, wajib diisi saat tutup kasir)|
|                                                                   |
|  Selisih:                                                         |
|  [  Rp 0  ]  (otomatis: actual - expected, bisa negatif/merah)   |
|                                                                   |
|  [  Simpan Settlement / Tutup Kasir  ]  (tombol primary)         |
|  (setelah simpan: bisa tampil konfirmasi "Settlement tersimpan")  |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
|  (Optional) Catatan:                                              |
|  - Settlement hanya bisa disimpan sekali per hari (atau sesuai   |
|    kebijakan: draft vs final).                                     |
|  - Admin bisa lihat laporan/settlement di halaman terpisah.      |
+------------------------------------------------------------------+
```

---

## 3. Alur penggunaan (flow)

1. **Kasir buka halaman Laporan & Settlement**
   - Melihat **Laporan Harian** untuk tanggal hari ini (default).
   - Melihat ringkasan: jumlah transaksi, total penjualan, tunai, non-tunai, diskon (dan PPN jika perlu).
   - (Optional) Melihat tabel detail transaksi hari itu.

2. **Kasir bisa ganti tanggal**
   - Memilih tanggal lain lalu "Tampilkan" → angka dan tabel mengikuti periode yang dipilih (untuk review hari sebelumnya).

3. **Kasir melakukan Settlement (saat tutup kasir)**
   - Melihat **Uang tunai yang seharusnya** (dari sistem, read-only).
   - Memasukkan **Uang tunai yang diserahkan** (actual cash).
   - Melihat **Selisih** (otomatis: actual − expected).
   - Klik **Simpan Settlement / Tutup Kasir** → data settlement tersimpan (dan optional: status "hari ini sudah tutup kasir").

4. **Setelah simpan**
   - Tampil pesan sukses; optional: tombol settlement disabled untuk hari itu atau tampil badge "Settlement tersimpan".

---

## 4. Ringkasan elemen UI

| Bagian            | Elemen tampilan |
|-------------------|------------------|
| Atas              | Header standar (logo, tanggal–waktu, user). |
| Navigasi          | Link "Kembali ke Dashboard". |
| Judul             | "Laporan & Settlement" + subtitle. |
| Periode           | Input tanggal + tombol "Tampilkan". |
| Laporan           | Beberapa kartu ringkasan (angka) + optional tabel transaksi. |
| Settlement        | 3 baris: Expected (read-only), Actual (input), Selisih (hasil); + tombol Simpan. |

Tanpa gambar/ilustrasi—hanya teks, kartu angka, form input, dan tabel seperti pola halaman lain di aplikasi.

---

## 5. Catatan untuk implementasi nanti

- **Laporan**: data dari agregasi transaksi (filter: tanggal, `order_status = completed`, `payment_status = paid`).
- **Settlement**: expected cash = sum transaksi tunai paid di tanggal itu; actual = input kasir; simpan ke tabel settlement (per tanggal, optional per kasir).
- **Backend**: endpoint GET laporan (query by date), GET/POST settlement (simpan actual + hitung selisih).

Dokumen ini hanya untuk pemahaman alur dan tampilan; implementasi kode menyusul setelah disetujui.

---

## 6. Apakah butuh database (tabel) baru?

### Laporan

- **Tidak wajib** tabel baru.  
  Laporan harian bisa dihitung langsung dari tabel **transaksi** yang sudah ada: filter by tanggal + status completed & paid, lalu agregasi (COUNT, SUM total_amount, SUM per payment_method, dll). Jadi cukup endpoint yang baca dari `transactions`.
- **Opsional:** kalau mau simpan **snapshot laporan per hari** (untuk riwayat/audit tanpa hitung ulang), bisa tambah satu tabel misalnya `daily_reports` (tanggal, total_transaksi, total_penjualan, total_tunai, total_non_tunai, …). Boleh nanti saja.

### Settlement

- **Butuh tabel baru** (misalnya `settlements`).  
  Alasannya: kita harus **menyimpan** hasil tutup kasir agar ada rekam jejak.
- Contoh kolom:
  - `id`
  - `date` (tanggal tutup kasir)
  - `user_id` (kasir yang tutup)
  - `expected_cash` (uang tunai yang seharusnya, dari sistem)
  - `actual_cash` (uang tunai yang diserahkan kasir, input kasir)
  - `discrepancy` / `selisih` (actual − expected)
  - `created_at`
- Satu baris per hari (atau per shift) per kasir. Jadi **hanya Settlement yang wajib pakai tabel baru**; Laporan bisa tanpa tabel baru.

---

## 7. Apa maksud Settlement? (penjelasan sederhana)

**Settlement** = **rekonsiliasi uang tunai** saat kasir tutup kasir di akhir hari (atau akhir shift).

### Kenapa ada Settlement?

- Sepanjang hari, pelanggan ada yang bayar **tunai**. Uang itu masuk ke laci kasir.
- Sistem mencatat setiap transaksi: yang bayar tunai berapa (misalnya transaksi A Rp 50.000, B Rp 30.000, …).
- Di akhir hari, **sistem** bisa hitung: “Hari ini total uang tunai yang seharusnya ada di laci = Rp 280.000” (dari jumlah semua transaksi tunai yang statusnya sudah dibayar). Itu yang disebut **expected cash** (uang yang seharusnya).
- Kasir lalu **menghitung fisik** uang di laci dan memasukkan angka itu ke sistem: “Saya serahkan uang tunai Rp 280.000.” Itu yang disebut **actual cash** (uang yang benar-benar diserahkan).
- **Settlement** = membandingkan keduanya:
  - **Expected cash** = dari sistem (read-only).
  - **Actual cash** = input kasir (berapa uang yang dia serahkan).
  - **Selisih** = actual − expected (otomatis). Kalau 0 = cocok; kalau minus = kurang; kalau plus = lebih.

### Contoh singkat

- Transaksi tunai hari ini (dari sistem): Rp 280.000 → **Expected cash = Rp 280.000**.
- Kasir hitung uang di laci, ternyata Rp 279.000 → **Actual cash = Rp 279.000**.
- **Selisih = −Rp 1.000** (kurang Rp 1.000).  
  Dengan settlement, kita tahu ada selisih dan bisa dicatat/dilaporkan.

### Ringkas

- **Settlement** = proses “tutup kasir”: sistem kasih angka **uang tunai yang seharusnya**, kasir isi **uang tunai yang diserahkan**, sistem hitung **selisih**. Data ini disimpan di database (tabel `settlements`) agar ada bukti dan riwayat.

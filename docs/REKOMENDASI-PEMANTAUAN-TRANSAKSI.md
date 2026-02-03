# Rekomendasi: Pemantauan Transaksi dengan Grafik (Harian, Bulanan, Per Kasir)

Dokumen ini berisi rekomendasi fitur **pemantauan transaksi** untuk admin: grafik per hari, per bulan, dan per kasir. Belum implementasi kode—hanya konsep dan kebutuhan data.

---

## 1. Yang ingin dicapai

- **Grafik harian**: tren transaksi dan/atau pendapatan per hari (misalnya 7 hari terakhir atau 30 hari terakhir).
- **Grafik bulanan**: tren transaksi dan/atau pendapatan per bulan (misalnya 6–12 bulan terakhir).
- **Per kasir**: jumlah transaksi dan total pendapatan yang dilakukan oleh **setiap kasir** (harian atau bulanan), agar admin bisa memantau kinerja per kasir.

---

## 2. Rekomendasi tampilan (di mana & apa)

### 2.1 Lokasi

- **Opsi A:** Di **Dashboard Admin** (halaman yang sekarang): tambah section “Pemantauan Transaksi” berisi grafik harian + bulanan + (opsional) ringkasan per kasir.
- **Opsi B:** Di **halaman Laporan** terpisah (misalnya setelah klik “Laporan” di Quick Actions): semua grafik + filter tanggal + filter kasir + tabel detail.
- **Opsi C:** Kombinasi: di dashboard hanya grafik ringkas (harian + bulanan); di halaman Laporan ada grafik lengkap + per kasir + filter.

Rekomendasi: **Opsi C** — dashboard untuk overview cepat, halaman Laporan untuk analisis detail dan per kasir.

### 2.2 Grafik harian

- **Sumbu X:** Tanggal (misalnya 7 atau 30 hari terakhir).
- **Sumbu Y:** Bisa salah satu atau keduanya (dalam dua grafik atau dua series):
  - Jumlah transaksi (count) per hari.
  - Total pendapatan (Rp) per hari — dari transaksi yang **completed** dan **paid**.
- **Jenis grafik:** Line chart atau bar chart.
- **Sumber data:** Agregasi dari tabel **transaksi** (filter: `order_status = completed`, `payment_status = paid`, `created_at` dalam rentang tanggal). **Tidak butuh tabel baru.**

### 2.3 Grafik bulanan

- **Sumbu X:** Bulan (misalnya Jan 2026, Des 2025, …).
- **Sumbu Y:** Jumlah transaksi dan/atau total pendapatan per bulan.
- **Jenis grafik:** Bar chart.
- **Sumber data:** Agregasi dari tabel **transaksi** (group by bulan dari `created_at`). **Tidak butuh tabel baru.**

### 2.4 Pemantauan per kasir

- **Tampilan:** Tabel atau grafik (bar) per kasir: nama kasir, jumlah transaksi, total pendapatan (dalam periode yang dipilih: hari/bulan).
- **Filter:** Rentang tanggal; optional filter “semua kasir” vs “per kasir”.
- **Sumber data:** Untuk bisa “per kasir”, setiap transaksi harus **terhubung ke kasir** yang menangani transaksi itu.

---

## 3. Kebutuhan data: “Per kasir”

Saat ini di model **Transaction** tidak ada kolom yang menyimpan **kasir yang menangani** transaksi. Jadi untuk pemantauan **per kasir** kita perlu menambah atribusi.

### 3.1 Opsi: Tambah kolom di tabel transaksi

- **Nama kolom (contoh):** `closed_by_user_id` atau `cashier_id` (UUID, nullable, foreign key ke `users`).
- **Diisi kapan:** Saat kasir melakukan aksi yang “menyelesaikan” transaksi, misalnya:
  - Saat **konfirmasi pembayaran tunai** (endpoint confirm cash-paid), atau
  - Saat **mengubah status pesanan jadi completed** (update order status to completed).
- **Aturan (contoh):** Siapa terakhir melakukan aksi itu, user_id-nya yang disimpan (atau hanya kasir yang konfirmasi tunai / yang tandai selesai).
- **Dampak:** Setiap transaksi punya “pemilik” kasir → kita bisa filter dan agregasi per `closed_by_user_id` untuk grafik/tabel per kasir.

Tanpa kolom ini, kita hanya bisa tampilkan **total harian/bulanan** (tanpa breakdown per kasir). Dengan kolom ini, kita bisa tampilkan **transaksi dan pendapatan per kasir** (harian/bulanan).

### 3.2 Ringkas

- **Grafik harian & bulanan (total):** Cukup pakai tabel **transaksi** yang ada + filter tanggal, status completed & paid. **Tidak butuh tabel baru.**
- **Grafik/tabel per kasir:** Butuh **satu kolom baru** di tabel transaksi: `closed_by_user_id` (atau `cashier_id`) yang diisi saat kasir konfirmasi tunai atau tandai selesai. **Tidak butuh tabel baru**, hanya tambah kolom + logika isi kolom di backend.

---

## 3.3 "Di tabel Transaction tidak ada nama kasir" — solusi

Memang saat ini di tabel **Transaction** tidak ada kolom yang menyimpan kasir yang memproses. Agar laporan bisa menampilkan **nama kasir per transaksi** dan agregasi **per kasir**, lakukan berikut.

### Langkah 1: Tambah kolom di tabel `transactions`

- **Nama kolom:** `closed_by_user_id` (tipe UUID, nullable, foreign key ke `users.id`).
- Arti: user (kasir) yang “menutup”/memproses transaksi ini (konfirmasi tunai atau tandai selesai).
- **Nullable:** Transaksi lama yang belum punya kasir tetap boleh kosong; transaksi baru yang diproses kasir akan terisi.

### Langkah 2: Kapan kolom diisi (di backend)

Isi `closed_by_user_id` dengan **user_id kasir yang login** saat:

1. **Konfirmasi pembayaran tunai** — saat endpoint `PATCH /transaction/:id/cash-paid` dipanggil (kasir yang konfirmasi = kasir yang memproses transaksi tunai itu).
2. **Update status jadi completed** — saat endpoint `PATCH /transaction/:id/order-status` dipanggil dengan `order_status: "completed"` (kasir yang tandai selesai = kasir yang memproses).

Ambil `user_id` dari JWT/context (siapa yang panggil endpoint). Hanya isi jika role-nya kasir (atau admin, tergantung kebijakan).

### Langkah 3: Menampilkan nama kasir di laporan

- Di **backend:** Saat ambil data transaksi untuk laporan, **join** tabel `transactions` dengan `users` on `transactions.closed_by_user_id = users.id`.
- Return field tambahan, misalnya: `closed_by_user_name` (dari `users.name`). Jadi di response API laporan, setiap transaksi bisa punya `closed_by_user_id` dan `closed_by_user_name`.
- Di **frontend:** Tabel laporan tampilkan kolom “Kasir” dengan nilai `closed_by_user_name`. Untuk agregasi per kasir, group by `closed_by_user_id` lalu tampilkan nama dari join/response.

### Ringkas

| Masalah | Solusi |
|--------|--------|
| Tidak ada nama kasir di transaksi | Tambah kolom `closed_by_user_id` di tabel `transactions`. |
| Kolom kapan terisi? | Saat kasir konfirmasi tunai (cash-paid) atau tandai selesai (order-status completed). |
| Nama kasir dari mana? | Join `transactions` dengan `users`; tampilkan `users.name` di laporan. |

Transaksi yang **sudah ada** di DB (sebelum kolom ini ditambah) akan punya `closed_by_user_id = null` — di laporan bisa tampil “—” atau “Tidak tercatat”. Transaksi **baru** setelah deploy akan terisi otomatis.

---

## 4. Ringkasan rekomendasi

| Fitur | Sumber data | Butuh DB baru? | Keterangan |
|-------|-------------|-----------------|------------|
| Grafik harian (transaksi & pendapatan) | Tabel `transactions` | Tidak | Filter by date, status completed & paid, agregasi per hari. |
| Grafik bulanan (transaksi & pendapatan) | Tabel `transactions` | Tidak | Group by bulan, agregasi. |
| Pemantauan per kasir | Tabel `transactions` | Tidak (tapi perlu kolom baru) | Tambah kolom `closed_by_user_id` di transaksi; isi saat kasir konfirmasi tunai / tandai selesai. |

---

## 5. Alur tampilan (wireframe singkat)

### Dashboard Admin (tambahan)

```
+------------------------------------------------------------------+
|  Pemantauan Transaksi                                             |
|  (periode: 7 hari terakhir)                                       |
|  +---------------------------+  +---------------------------+     |
|  | Grafik: Transaksi per hari|  | Grafik: Pendapatan per hari|   |
|  | (line/bar, 7 titik)       |  | (line/bar, 7 titik)       |     |
|  +---------------------------+  +---------------------------+     |
|  [Laporan lengkap →]                                               |
+------------------------------------------------------------------+
```

### Halaman Laporan (detail)

```
+------------------------------------------------------------------+
|  Laporan Transaksi                                                |
|  Tanggal: [____] s/d [____]   Kasir: [Semua ▼]   [Tampilkan]      |
+------------------------------------------------------------------+
|  Grafik bulanan (transaksi / pendapatan per bulan)                |
|  [======== bar chart ========]                                    |
+------------------------------------------------------------------+
|  Per kasir (tabel)                                                |
|  | Nama Kasir  | Jumlah Transaksi | Total Pendapatan |            |
|  | Kasir 1     | 45               | Rp 1.250.000    |            |
|  | Kasir 2     | 38               | Rp 980.000       |            |
+------------------------------------------------------------------+
```

---

## 6. Implementasi nanti (urutan yang disarankan)

1. **Backend:** Endpoint agregasi laporan (harian, bulanan) dari transaksi — tanpa kolom kasir dulu.
2. **Frontend:** Grafik harian & bulanan di dashboard admin dan/atau halaman Laporan (pakai library chart, misalnya Chart.js / Recharts).
3. **Backend:** Tambah kolom `closed_by_user_id` di transaksi; isi di endpoint confirm cash-paid dan update order-status (completed).
4. **Backend:** Endpoint agregasi per kasir (filter by `closed_by_user_id`, date range).
5. **Frontend:** Tabel/grafik per kasir di halaman Laporan + filter kasir.

Dokumen ini hanya untuk pemahaman dan perencanaan; implementasi kode menyusul setelah disetujui.

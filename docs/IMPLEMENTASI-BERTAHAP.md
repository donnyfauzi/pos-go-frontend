# Implementasi Laporan & Settlement — Bertahap

Daftar fase dan status. Setiap fase selesai dan berhasil baru lanjut ke fase berikutnya.

---

## Fase 1: Backend — Kolom `closed_by_user_id` + pengisian otomatis ✅

**Status:** Selesai (kode sudah ditambah).

**Yang dilakukan:**

1. **Model `Transaction`** (pos-go)
   - Tambah kolom `ClosedByUserID *uuid.UUID` (nullable), JSON: `closed_by_user_id`.
   - GORM AutoMigrate akan menambah kolom di DB saat server dijalankan.

2. **Konfirmasi tunai (ConfirmCashPaid)**
   - Controller: ambil `user_id` dari context (JWT), parse ke UUID, kirim ke service.
   - Service: `ConfirmCashPaid(id, closedByUserID *uuid.UUID)`; saat update `payment_status = paid` juga set `closed_by_user_id` jika `closedByUserID != nil`.

3. **Update status completed (UpdateOrderStatus)**
   - Controller: jika role = kasir dan `order_status` = completed, ambil `user_id` dari context dan kirim ke service.
   - Service: `UpdateOrderStatusForRole(id, role, newStatus, closedByUserID *uuid.UUID)`; saat update ke `completed` juga set `closed_by_user_id` jika `closedByUserID != nil`.

**Cara cek Fase 1:**

1. Restart backend (agar AutoMigrate menambah kolom `closed_by_user_id`).
2. Login sebagai kasir, lakukan:
   - Konfirmasi pembayaran tunai pada satu transaksi, atau
   - Tandai pesanan selesai (completed).
3. Cek di DB: `SELECT id, closed_by_user_id, order_status, payment_status FROM transactions ORDER BY updated_at DESC LIMIT 5;` — transaksi yang baru dikonfirmasi/tandai selesai harus punya `closed_by_user_id` terisi.

**Transaksi lama:** `closed_by_user_id` tetap null (normal).

---

## Fase 2: Backend — Endpoint Laporan (agregasi harian + detail) ✅

**Status:** Selesai (kode sudah ditambah).

**Yang dilakukan:**

1. **DTO** (`dto/report_dto.go`)
   - `ReportSummary`: date, total_transactions, total_sales, total_cash, total_non_cash, total_discount, total_tax.
   - `ReportTransactionItem`: id, customer_name, order_type, payment_method, total_amount, closed_by_user_id, closed_by_user_name, created_at.
   - `ReportResponse`: summary + transactions.

2. **Service** (`services/report_service.go`)
   - `GetReportByDate(dateStr string)`: parse date (YYYY-MM-DD), filter transaksi `created_at` hari itu + `order_status = completed` + `payment_status = paid`, agregasi summary, ambil nama kasir dari `users` (join via closed_by_user_id), return ReportResponse.

3. **Controller** (`controllers/report_controller.go`)
   - `GetReportByDate(c)`: ambil query param `date`, panggil service, return JSON. Jika tanggal invalid → 400; jika DB error → 500.

4. **Route** (`routes/report_route.go`)
   - `GET /report?date=YYYY-MM-DD` — AuthMiddleware + RequireRole("admin", "kasir").

5. **main.go**
   - `routes.ReportRoutes(r)`.

**Cara cek Fase 2:**

1. Restart backend.
2. Login sebagai admin atau kasir (cookie terkirim).
3. Request: `GET http://localhost:8080/report?date=2026-01-30` (ganti tanggal sesuai data).
4. Response: `{ success, message, data: { summary: {...}, transactions: [...] } }`. Summary berisi total transaksi, total penjualan, tunai, non-tunai, diskon, PPN. List transaksi berisi nama kasir (`closed_by_user_name`) atau "-" jika null.

---

## Fase 3: Backend — Tabel Settlement + endpoint POST/GET ✅

**Status:** Selesai (kode sudah ditambah).

**Yang dilakukan:**

1. **Model** (`models/settlement_model/settlement.go`)
   - Tabel `settlements`: id, date (DATE), user_id, expected_cash, actual_cash, discrepancy, created_at, updated_at.
   - Unique index (date, user_id) — satu settlement per tanggal per kasir.

2. **DTO** (`dto/settlement_dto.go`)
   - `CreateSettlementRequest`: date (YYYY-MM-DD), actual_cash.
   - `SettlementResponse`: id, date, user_id, expected_cash, actual_cash, discrepancy, created_at.
   - `GetSettlementResponse`: expected_cash + settlement (null jika belum ada).

3. **Service** (`services/settlement_service.go`)
   - `expectedCashFromTransactions(start, end)`: sum total_amount dari transaksi cash, paid, completed di rentang tanggal.
   - `CreateSettlement(userID, dateStr, actualCash)`: hitung expected, discrepancy = actual - expected, simpan. Jika sudah ada settlement (date, user_id) → ErrSettlementAlreadyExists.
   - `GetSettlementByDateAndUser(dateStr, userID)`: return settlement atau nil.
   - `GetSettlementWithExpected(dateStr, userID)`: return expected_cash + settlement (untuk GET).

4. **Controller** (`controllers/settlement_controller.go`)
   - `GetSettlement(c)`: GET /settlement?date= — user_id dari JWT, return GetSettlementResponse.
   - `CreateSettlement(c)`: POST /settlement body { date, actual_cash } — user_id dari JWT, simpan settlement.

5. **Route** (`routes/settlement_route.go`)
   - GET /settlement?date=YYYY-MM-DD — Auth + RequireRole("admin", "kasir").
   - POST /settlement — Auth + RequireRole("admin", "kasir").

6. **config/db.go** — AutoMigrate menambah tabel `settlements`. **main.go** — `routes.SettlementRoutes(r)`.

**Cara cek Fase 3:**

1. Restart backend (agar tabel `settlements` terbentuk).
2. **GET** `http://localhost:8080/settlement?date=2026-01-30` (dengan token): response `{ expected_cash, settlement: null }` atau `{ expected_cash, settlement: {...} }` jika sudah pernah simpan.
3. **POST** `http://localhost:8080/settlement` body `{ "date": "2026-01-30", "actual_cash": 280000 }`: response 201 + data settlement (expected_cash, actual_cash, discrepancy).
4. POST lagi untuk tanggal yang sama dengan user yang sama → 400 "Settlement untuk tanggal ini sudah ada".

---

## Fase 4: Frontend — Halaman Kasir Laporan & Settlement ✅

**Status:** Selesai (kode sudah ditambah).

**Yang dilakukan:**

1. **Service** (`src/services/reportService.ts`)
   - `getReportByDate(date)` → GET /report?date=
   - `getSettlement(date)` → GET /settlement?date= (expected_cash + settlement)
   - `createSettlement(date, actual_cash)` → POST /settlement
   - Type: ReportSummary, ReportTransactionItem, ReportResponse, SettlementResponse, GetSettlementResponse.

2. **Halaman** (`src/pages/kasir/LaporanSettlement.tsx`)
   - Header sama dengan Dashboard Kasir (logo, DateTimeWidget, user dropdown).
   - Link "Kembali ke Dashboard".
   - Pilih tanggal (input date) + tombol "Tampilkan" — fetch report + settlement untuk tanggal itu.
   - **Laporan Harian:** kartu ringkasan (Total Transaksi, Total Penjualan, Tunai, Non-Tunai, Diskon, PPN 10%) + tabel detail transaksi (No, Waktu, Pelanggan, Pembayaran, Kasir, Total).
   - **Settlement:** Expected cash (read-only), Actual cash (input), Selisih (otomatis), tombol "Simpan Settlement / Tutup Kasir". Jika settlement untuk tanggal itu sudah ada, tampil "Settlement untuk tanggal ini sudah tersimpan" dan form disabled.
   - Alert error/success.

3. **Route** (`App.tsx`): `/kasir/laporan` — ProtectedRoute allowedRoles kasir, component LaporanSettlement.

4. **Dashboard Kasir:** dropdown user ditambah item "Laporan & Settlement" (icon FileText) → navigate ke /kasir/laporan.

**Cara cek Fase 4:**

1. Login sebagai kasir, buka dashboard kasir.
2. Klik user dropdown → "Laporan & Settlement" → masuk ke halaman Laporan & Settlement.
3. Pilih tanggal (default hari ini), klik "Tampilkan" — kartu ringkasan dan tabel transaksi terisi dari API report; bagian Settlement menampilkan expected cash dari API settlement.
4. Isi "Uang tunai yang diserahkan kasir", cek selisih, klik "Simpan Settlement / Tutup Kasir" — request POST settlement; setelah sukses, tampil "Settlement tersimpan" dan form settlement disabled untuk tanggal itu.

---

## Fase 5: Frontend — Admin Dashboard grafik ringkas

**Status:** Pending.

- Section “Pemantauan Transaksi” di dashboard admin: grafik harian (7 hari), grafik bulanan (6 bulan).
- Link “Laporan lengkap” ke halaman Laporan.

---

## Fase 6: Frontend — Admin halaman Laporan lengkap

**Status:** Pending.

- Halaman Laporan admin: filter tanggal, grafik, tabel per kasir (nama kasir, jumlah transaksi, total pendapatan).

---

Setelah Fase 1 berhasil dicek (kolom ada, nilai terisi), lanjut ke Fase 2.

# AGENTS.md — Konteks Project SEARAH

Dokumen ini adalah ringkasan konteks project untuk AI coding agent (OpenCode). Baca ini di setiap sesi sebelum mengerjakan task apa pun. Detail lengkap ada di `PRD_SEARAH.md` — dokumen ini hanya ringkasan yang wajib diingat terus.

## Apa Itu SEARAH

Aplikasi mobile yang mempertemukan pekerja kantoran di Jabodetabek dengan rute pulang-pergi kerja yang searah — untuk teman ngobrol di transportasi umum, atau berbagi tumpangan kendaraan pribadi (carpool). Fokus fase awal: **Jabodetabek saja**, **tanpa model monetisasi**.

## Non-Goals — JANGAN Dibangun

- **Bukan ojek online.** Jangan pernah membuat fitur "cari driver terdekat sekarang" (dispatch real-time), tarif resmi per perjalanan, komisi platform dari transaksi, atau leaderboard "paling banyak antar orang". Semua matching berbasis rute rutin + jadwal yang sudah diposting, bukan on-demand.
- **Bukan aplikasi kencan murni.** Fitur kecocokan personal hanya untuk pengguna yang sudah punya histori trust dari commuting, bukan mode swipe terbuka untuk orang asing baru.
- **Jangan membangun fitur pembayaran in-app** untuk split biaya carpool. Split biaya (bensin/tol) adalah kesepakatan personal via chat, di luar sistem.
- **Jangan bangun eKYC/integrasi Dukcapil di awal.** Verifikasi identitas fase awal cukup manual (lihat bagian Verifikasi di bawah).

## Tech Stack (lihat PRD bagian 10 untuk detail & alasan)

**Strategi platform: WEB-FIRST, mobile native menyusul kemudian.** Jangan mulai dengan React Native — mulai dengan web app dulu untuk validasi cepat, baru pindah/expand ke mobile native setelah konsep tervalidasi.

- Frontend: **Next.js (React + TypeScript)** — web app dulu, bukan React Native
- Pengalaman mobile sementara: **PWA (Progressive Web App)** — supaya bisa "diinstall" ke homescreen tanpa build native
- Mobile native (JANGAN dikerjakan dulu): React Native (TypeScript), baru dibangun setelah web tervalidasi
- Backend: **Node.js + NestJS (TypeScript)**
- Database: **PostgreSQL + ekstensi PostGIS** (wajib untuk query geospasial corridor/detour matching — jangan diganti database non-geospasial)
  - Setup lokal: gunakan **Docker + image `postgis/postgis`** untuk database (PostGIS sudah termasuk, tidak perlu install manual). Laragon (kalau dipakai founder) tetap bisa untuk kebutuhan lain, tapi database utama tetap lewat Docker container ini.
- Cache/pre-filter: **Redis**
- Realtime chat: Socket.io (self-host) atau Firebase Realtime Database
- Storage file (foto KTP/selfie): S3-compatible, **wajib terenkripsi**
- Peta/routing: Google Maps Directions/Distance Matrix API, dengan opsi OSRM self-host
- Hosting: region Singapura/Jakarta (latensi rendah untuk Jabodetabek); Vercel cocok untuk hosting Next.js di fase awal
- Environment variable: lihat `.env.example` yang sudah dibuat — jangan hardcode API key/secret di kode

**Keterbatasan web-first yang harus diperhatikan saat implementasi:**
- GPS/live location (share trip) kurang reliable di web dibanding native — hanya jalan optimal selama tab/PWA aktif di layar
- Push notification web (Web Push API) tidak seseamless native, terutama di iOS Safari
- Kamera untuk foto KTP/selfie tetap bisa diakses via `<input type="file" capture>` atau WebRTC — tidak ada masalah berarti di web

Prioritaskan layanan tier gratis/murah dulu (Supabase, Railway, Vercel, Firebase free tier) karena tidak ada monetisasi di fase awal — ini project pertama founder, budget terbatas.

## Model Verifikasi Bertahap (JANGAN loncat ke Tingkat 3 langsung)

- **Tingkat 1 (bangun ini dulu):** foto KTP + selfie, disimpan untuk direview manual oleh admin — bukan otomatis via API pihak ketiga. Opsional untuk sekadar gabung komunitas, tapi kasih badge "terverifikasi" sebagai insentif.
- **Tingkat 2:** verifikasi Tingkat 1 menjadi wajib khusus sebelum user bisa accept/kirim permintaan carpool.
- **Tingkat 3 (JANGAN dibangun dulu, ini roadmap masa depan):** integrasi eKYC resmi ke Dukcapil (Privy/VIDA/Verihubs). Jangan implementasi ini kecuali diminta eksplisit.

## Logika Matching "Searah" (inti produk, urutkan dari murah ke mahal)

1. Bearing check (selisih arah kompas kasar) — filter awal murah
2. Corridor/buffer matching (radius toleransi di sekitar polyline rute)
3. Geohash/H3 grid overlap — pre-filter sebelum panggil routing API berbayar
4. Perhitungan detour presisi via Directions API waypoints (hanya untuk kandidat yang lolos filter 1-3)
5. Traffic-aware (pakai `departure_time` di Directions API)

**Titik akhir TIDAK harus sama persis** antara dua pengguna. Skema data tujuan perjalanan harus generik: `destination_type` (rumah | kantor | titik_transit) + koordinat — jangan hardcode field "kantor" sebagai satu-satunya jenis tujuan.

## Model Fitur — Dua Alur Berbeda, Jangan Disamakan

- **Teman Ngobrol Sejalan (KRL/bus):** grup komunitas terbuka, siapa saja anggota bisa chat bebas, **tanpa proses accept**.
- **Carpool (kendaraan pribadi):** model **posting → discover → interaksi/chat → accept/decline oleh pengemudi**. Kendali penuh ada di pengemudi, bukan auto-match.
- **Rating** HANYA berlaku untuk sesi carpool yang sudah di-accept dan selesai — bukan untuk interaksi komunitas/teman ngobrol.
- **Carpool motor** butuh field eksplisit "punya helm cadangan?" (Ya/Tidak), tampil jelas di listing, bukan disembunyikan.

## Privasi Lokasi (WAJIB dipisah sejak desain database)

- Dua lapis titik lokasi: **titik internal (presisi)** untuk kalkulasi matching, dan **titik publik (dikaburkan)** yang ditampilkan ke pengguna lain — jangan pernah kirim titik presisi rumah pengguna ke device pengguna lain.
- Titik publik = snap ke landmark terdekat atau offset acak radius 300-500m.
- Lokasi jemput presisi baru disepakati manual via chat setelah accept, bukan dibuka otomatis oleh sistem.

## Keamanan yang Tidak Boleh Dilewatkan

- Tombol SOS harus selalu terlihat di layar sesi perjalanan aktif, tidak boleh disembunyikan di menu.
- Share trip ke kontak darurat saat sesi carpool aktif.
- Sistem report/block harus ada sejak MVP pertama, bukan ditunda.
- Rate-limit chat untuk akun baru (anti-spam/scam).
- Data KTP/wajah wajib terenkripsi di storage — cek ulang setiap kali menyentuh kode terkait upload dokumen identitas.

## Cara Kerja dengan Codebase Ini

- Kerjakan fitur secara bertahap sesuai urutan MVP di PRD (bagian 7) — jangan langsung membangun fitur Fase 2/3 sebelum MVP dasar (registrasi Tingkat 1, setup rute, komunitas, chat grup, report/block) selesai dan berjalan.
- Untuk perubahan yang menyentuh auth, penyimpanan data identitas, atau logic verifikasi — tampilkan rencana dulu (mode Plan) sebelum eksekusi (mode Build), karena ini bagian sensitif.
- Kalau ragu apakah sebuah fitur baru bertentangan dengan Non-Goals di atas (terutama soal ojek online), tanyakan dulu ke founder sebelum diimplementasikan.

## Referensi

- `PRD_SEARAH.md` — dokumen produk lengkap (konsep, semua keputusan, detail teknis)
- `.env.example` — daftar environment variable yang dibutuhkan
- `searah_wireframe.html` — wireframe alur UI/UX 6 layar utama (referensi alur & konten; saat implementasi web, sesuaikan jadi layout responsive web, bukan komponen native mobile)
- `Rencana_Validasi_SEARAH.md` — rencana validasi manual ke calon pengguna sebelum/selama development

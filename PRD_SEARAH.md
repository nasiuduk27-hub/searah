# Product Requirements Document (PRD)
# SEARAH — Teman Seperjalanan Pulang & Pergi Kerja

**Versi:** 0.1 (Draft)
**Tanggal:** 3 September 2026
**Status:** Draft untuk diskusi internal

---

## 1. Latar Belakang & Problem Statement

Banyak pekerja kantoran menghabiskan 30 menit–2 jam sehari di perjalanan pulang-pergi kerja, seringkali sendirian. Perjalanan ini bisa terasa membosankan, melelahkan secara mental, dan menjadi waktu "kosong" yang sebenarnya bisa diisi dengan interaksi sosial yang positif — entah sekadar mengobrol, curhat soal kerjaan, atau berbagi tumpangan supaya lebih hemat dan tidak sendirian.

Saat ini belum ada platform yang secara spesifik menjodohkan orang berdasarkan **kesamaan arah rute rumah-kantor** dan **jenis transportasi**, sekaligus memberi ruang untuk membangun koneksi sosial (bukan cuma transaksi tumpangan seperti ride-hailing).

**SEARAH** hadir sebagai aplikasi yang mencocokkan orang-orang dengan rute pulang-pergi kerja yang searah, agar perjalanan commuting jadi lebih bermakna, aman, dan tidak membosankan — baik untuk sekadar teman ngobrol maupun berbagi kendaraan.

---

## 2. Visi Produk

> "Nggak ada lagi jalan pulang kerja yang sepi. SEARAH menemukan teman seperjalananmu."

---

## 3. Tujuan (Goals)

0. **Cakupan awal: Jabodetabek.** SEARAH diluncurkan terlebih dahulu di wilayah Jabodetabek untuk memvalidasi konsep dan membangun kepadatan pengguna, sebelum ekspansi ke kota/wilayah lain setelah traksi pengguna cukup besar (viral).
1. Memungkinkan pengguna menemukan orang lain dengan rute commuting yang searah (rumah↔kantor).
2. Memfasilitasi carpooling informal antara pengguna berkendaraan dan tidak berkendaraan pada rute yang sama.
3. Membangun komunitas berbasis rute/area/moda transportasi untuk berbagi cerita, keluh-kesah kerja, dan koneksi sosial.
4. Menjamin keamanan pengguna melalui proses verifikasi identitas yang ketat, mengingat aplikasi ini mempertemukan orang asing secara fisik.

### Non-Goals (di luar cakupan awal)
- Menjadi kompetitor ride-hailing berbayar dengan tarif resmi (SEARAH bukan platform transaksi jasa transportasi berbayar seperti taksi online — untuk menghindari isu regulasi transportasi publik).
- Menjadi aplikasi kencan murni (fitur seperti dating app hanya sebagai *pelengkap* koneksi sosial berbasis rute, bukan fokus utama).
- Memfasilitasi pembayaran/split cost secara otomatis di dalam sistem — kesepakatan biaya carpool adalah urusan personal antar pengguna via chat (lihat bagian 13).
- Memiliki model monetisasi di fase awal — fokus MVP murni pada growth dan viralitas pengguna di Jabodetabek.
- **Menjadi "ojek online versi komunitas"** — SEARAH secara sadar dan tegas bukan pengganti ojek online. Lihat 5.2.3 untuk perbedaan mendasar dan guardrail yang menjaga posisi ini.

#### 3.1 SEARAH vs Ojek Online — Penegasan Batas

Karena fitur matching semakin fleksibel (titik akhir bisa asimetris, bisa berupa titik transit KRL/TransJakarta, dsb.), penting ditegaskan sejak sekarang bahwa SEARAH **tidak dirancang untuk menggantikan ojek online**, baik secara fungsi maupun model insentif:

| | Ojek Online | SEARAH |
|---|---|---|
| Siapa yang jalan | Driver khusus narik penumpang, itu pekerjaannya | Kedua pihak sama-sama commuter yang memang mau ke arah situ untuk kebutuhan sendiri |
| Tujuan pengemudi | Ditentukan penumpang (order dari mana ke mana) | Tujuan pengemudi **sudah tetap lebih dulu** (mau ke kantornya sendiri); penumpang cuma numpang di sepanjang rute itu |
| Bisa "order" kapan saja? | Ya, on-demand kapan pun | Tidak — hanya bisa "nebeng" kalau kebetulan searah & jadwal cocok; sifatnya terjadwal, bukan on-demand |
| Uang | Tarif resmi per perjalanan | Split biaya sukarela (bensin/tol), bukan tarif jasa |
| Untung platform dari transaksi | Aplikasi ambil komisi tiap transaksi | Tidak ada komisi — SEARAH tidak mengambil apa pun dari kesepakatan split cost |

Ini bukan cuma soal positioning/branding, tapi berdampak legal (mencegah dianggap angkutan umum tak berizin — lihat bagian 12 Risiko Regulasi), fokus produk (value SEARAH adalah kebetulan searah + koneksi sosial, bukan kecepatan/kepastian layanan ala ride-hailing), dan menjaga insentif pengemudi tetap sehat (menolong karena kebetulan searah, bukan mengejar penumpang demi keuntungan).

---

## 4. Target Pengguna & Persona

| Persona | Deskripsi | Kebutuhan |
|---|---|---|
| **Rina, 27, Karyawan Swasta** | Naik KRL setiap hari, capek diam-diaman di kereta | Teman ngobrol, rute searah |
| **Bayu, 32, Punya Mobil Pribadi** | Kadang mobil kosong 3 kursi, mau bagi ongkos bensin & ada teman ngobrol | Cari penumpang searah, split cost |
| **Sari, 24, Naik Motor** | Takut pulang malam sendirian lewat jalan sepi | Teman seperjalanan demi rasa aman |
| **Dimas, 29, Baru Pindah ke Kota** | Belum punya circle pertemanan di kota baru | Komunitas & koneksi sosial baru |

---

## 5. Konsep Inti Produk

### 5.1 Route Matching (Inti Utama)
- Pengguna memasukkan **titik rumah** dan **titik kantor** (atau titik jemput/turun jika naik transportasi umum).
- Sistem menghitung **kesamaan arah rute** (bukan harus identik persis), menggunakan radius toleransi dan analisis jalur (misalnya via Google Maps Directions API / OSRM).
- Filter tambahan: jam berangkat/pulang, moda transportasi (mobil, motor, KRL, bus, jalan kaki), preferensi gender teman seperjalanan, dsb.

#### 5.1.1 Logika Matching "Searah" (Corridor & Detour)

Poin penting: untuk pengemudi (pemilik kendaraan), **tujuan akhir tetap rumah mereka sendiri** — sistem tidak mengubah tujuan pengemudi, hanya menilai apakah rute penumpang bisa "numpang lewat" tanpa membuat pengemudi banyak memutar. Pendekatan bertingkat (dari murah ke mahal secara komputasi/biaya API):

1. **Bearing check (penyaring awal, murah)** — bandingkan arah kompas kasar kantor→rumah kedua pengguna. Jika selisih arah terlalu besar (misal >45°), langsung dianggap tidak searah tanpa perlu hitung rute detail.
2. **Corridor/buffer matching** — ambil polyline rute pengemudi (kantor→rumah), buat koridor toleransi di sekitarnya (misal radius 300–500 meter). Titik jemput/tujuan penumpang yang jatuh di dalam koridor ini jadi kandidat kuat.
3. **Geohash/H3 grid overlap (penyaring skala, murah)** — ubah rute jadi rangkaian sel grid heksagonal, cek irisan sel antar rute sebelum memanggil routing API yang berbayar, supaya hemat biaya saat jumlah pengguna sudah besar.
4. **Perhitungan detour presisi (mahal, hanya untuk kandidat yang lolos filter di atas)** — bandingkan waktu tempuh langsung pengemudi (kantor→rumah) vs waktu tempuh jika mampir jemput/antar penumpang (kantor→titik penumpang→rumah), menggunakan Directions API dengan waypoints. Selisih waktu ini adalah "biaya detour". Jika di bawah ambang batas (misal maks 10–15 menit atau 15% dari waktu normal), rute dianggap benar-benar searah.
5. **Traffic-aware** — perhitungan detour sebaiknya memakai parameter waktu keberangkatan aktual (`departure_time`) agar memperhitungkan kondisi macet jam pulang kerja, bukan sekadar jarak lurus.
6. **Transportasi umum** — untuk pengguna KRL/bus (bukan kendaraan pribadi), matching berbasis jalur/line dan rentang stasiun yang beririsan, bukan polyline bebas seperti mobil.
7. **Personalisasi toleransi** — pengemudi dapat mengatur sendiri batas maksimal detour yang mereka terima (misal 5 menit vs 15 menit), sebagai bagian dari preferensi profil.

**Rekomendasi stack teknis awal (fase MVP, wilayah Jabodetabek):** Google Maps Directions API/Distance Matrix API (akurat, berbayar per call) atau OSRM self-hosted (gratis, perlu maintain server sendiri) sebagai titik awal evaluasi; simpan rute pengemudi sebagai encoded polyline + daftar waypoint di database untuk efisiensi query.

#### 5.1.2 Titik Akhir Asimetris & Titik Transit (Bukan Harus A↔B Sama Persis)

Penegasan penting yang harus dipahami tim dev sejak awal desain database/algoritma: **"searah" tidak mensyaratkan titik akhir kedua pengguna sama persis.** Ada beberapa variasi titik akhir yang sah dan harus diakomodasi:

1. **Titik akhir asimetris (kantor berbeda, salah satunya jadi titik transit)** — Contoh: Kamu (Rumah B → Kantor A) dan Rina (Rumah B, searah dengan rumahmu → Kantor A2, yang kebetulan berada di jalur SEBELUM Kantor A). Rutenya secara efektif: B → A2 → A. Kalian searah dari titik berangkat sampai A2, setelah itu kamu lanjut sendiri ke A. Sistem **tidak boleh mensyaratkan kantor sama** untuk menganggap dua orang searah — cukup overlap sebagian rute yang lolos ambang detour (lihat 5.1.1).
2. **Titik akhir berupa titik transit ke moda lain (bukan rumah/kantor)** — penumpang bisa saja hanya minta diantar sampai titik ganti moda (misal stasiun KRL atau halte TransJakarta terdekat), lalu melanjutkan perjalanan sendiri dari sana ke tujuan finalnya. Titik transit ini **punya koordinat tetap** (bisa memanfaatkan data GTFS TransJakarta yang dibahas di 7.1), sehingga secara teknis justru lebih mudah dihitung overlap-nya dibanding titik rumah yang lokasinya acak.
3. **Berlaku dua arah** — baik saat berangkat kerja (rumah→kantor/titik transit) maupun pulang kerja (kantor→rumah/titik transit), logika ini sama, hanya arah rutenya dibalik.

**Implikasi desain data**: skema database untuk "tujuan perjalanan" tidak boleh hardcode field `kantor` sebagai satu-satunya jenis titik akhir. Sebaiknya dibuat generik, misalnya `destination_type` (rumah | kantor | titik_transit) + koordinat, supaya fleksibel menampung ketiga skenario di atas tanpa perlu rombak skema nanti.

### 5.2 Tipe Kecocokan (Match Types)
1. **Teman Ngobrol Sejalan** — sama-sama naik transportasi umum, cuma pengen ada temen ngobrol/duduk bareng. Berbasis **grup komunitas rute/area** (lihat 5.2.2), tanpa proses accept — siapa pun anggota grup bisa saling sapa bebas.
2. **Carpool** — pemilik kendaraan menawarkan slot kosong ke pengguna searah tanpa kendaraan, bisa split biaya bensin/tol (bukan tarif komersial). Menggunakan **model posting-interaksi-accept** (lihat 5.2.1), berbeda dari teman ngobrol sejalan.
3. **Komunitas Rute/Area** — grup chat berdasarkan jalur/wilayah (misal "Bekasi–Sudirman KRL", "BSD–SCBD Mobil"), tempat berbagi info macet, keluh kesah kerja, dsb.
4. **Kecocokan Personal (berbasis histori searah, bukan swipe terbuka)** — direvisi dari konsep awal: bukan mode swipe/dating generik yang terbuka untuk semua pengguna, melainkan *progression* natural dari pengguna yang **sudah punya rekam jejak searah & trust level memadai** (sudah beberapa kali carpool/komunitas dengan rating baik). Setelah interaksi berulang lewat commuting, muncul opsi halus seperti "Tertarik kenal lebih jauh?" ke sesama pengguna searah — bukan tombol swipe ke orang asing baru. Pool ini secara alami lebih relevan untuk hubungan jangka panjang (sahabat/pasangan) karena domisili berdekatan dan rutinitas kerja mirip, bukan sekadar cocok dari foto profil. Lihat juga bagian 7.2 (ide Fase 4 — aktivitas weekend) yang memakai basis trust yang sama.

#### 5.2.1 Model Posting-Interaksi-Accept (khusus Carpool kendaraan pribadi)

Berbeda dari fitur teman ngobrol sejalan (KRL/bus) yang berbasis grup komunitas bebas, **carpool kendaraan pribadi menggunakan model posting/offer** mirip marketplace tumpangan (ala BlaBlaCar), karena risiko dan komitmennya lebih tinggi (naik kendaraan orang lain):

1. **Post** — pengemudi mempublikasikan rutenya sebagai "tawaran": kantor→rumah, jam berangkat, jumlah kursi kosong, toleransi detour.
2. **Discover** — calon penumpang searah (hasil dari logika corridor/detour di 5.1.1) melihat postingan ini di daftar.
3. **Interaksi** — penumpang mengirim pesan minat, ngobrol dulu untuk menilai kecocokan (jadwal, kenyamanan, dsb.) sebelum ada komitmen apa pun.
4. **Accept/Decline** — kendali penuh ada di tangan pengemudi untuk menerima atau menolak permintaan, bukan pencocokan otomatis oleh sistem.
5. **Sesi perjalanan** — begitu di-accept, baru masuk ke sesi aktif (share trip ke kontak darurat, tombol SOS, dsb. — lihat bagian 9.1 area sesi aktif pada wireframe).
6. **Rating** — lihat 5.2.2 di bawah untuk cakupan pastinya.

**Teman ngobrol sejalan (KRL/bus) TIDAK memakai model ini** — tetap berbasis grup komunitas terbuka tanpa proses accept, sesuai keputusan cakupan rating di bawah.

#### 5.2.1.1 Ketentuan Khusus Carpool Motor (Helm)

Berbeda dari mobil, carpool motor punya kendala fisik nyata yang harus transparan sejak proses posting, bukan didiskusikan mendadak di lokasi:

- Field **"Punya helm cadangan untuk penumpang?"** (Ya/Tidak) wajib diisi saat posting rute motor, dan tampil jelas di kartu listing (bukan disembunyikan di detail).
- Realistisnya, mayoritas listing motor kemungkinan besar akan berstatus **"tidak ada helm cadangan"**, karena kebanyakan orang di Indonesia hanya memiliki satu helm untuk dipakai sendiri sehari-hari — ini keterbatasan fisik yang wajar, bukan kelalaian pengemudi.
- Jika status "tidak ada helm cadangan", listing tetap boleh muncul dengan label eksplisit **"Penumpang wajib bawa helm sendiri"**, bukan disembunyikan dari hasil pencarian.
- Kejelasan status helm harus selesai di tahap posting/interaksi, **sebelum** accept — menghindari situasi canggung di lokasi (sudah janjian, baru sadar tidak ada helm).
- Konsekuensi produk: carpool motor secara realistis akan lebih terbatas cakupannya dibanding carpool mobil di fase awal karena kendala helm ini. Ini dicatat sebagai keterbatasan yang diterima di MVP, bukan sesuatu yang dipaksakan solusinya (misalnya menyuruh pengemudi wajib beli helm cadangan) — biarkan pasangan pengguna yang sudah rutin/kenal baik yang biasanya menyelesaikan ini sendiri (salah satu pihak berinisiatif sedia helm cadangan setelah beberapa kali cocok).
- Catatan hukum: mengendarai/berkendara motor tanpa helm SNI melanggar aturan lalu lintas di Indonesia — pengingat singkat soal ini sebaiknya muncul di alur posting/interaksi carpool motor, sebagai edukasi pengguna, bukan sebagai bentuk tanggung jawab hukum SEARAH.

#### 5.2.2 Cakupan Sistem Rating

Berdasarkan diskusi, **rating hanya berlaku untuk sesi carpool kendaraan pribadi yang sudah di-accept dan selesai dijalani** — bukan untuk interaksi di grup komunitas atau teman ngobrol sejalan transportasi umum. Implikasinya:
- Trigger rating adalah event "sesi carpool selesai" pada pasangan pengemudi-penumpang yang sudah saling accept, bukan sekadar chat atau muncul di daftar pencarian.
- Pengguna yang hanya memakai fitur teman ngobrol sejalan/komunitas (tanpa pernah carpool) tidak memiliki riwayat rating — trust mereka tetap dibangun lewat verifikasi identitas (bagian 9.1) dan sistem laporan/report, bukan rating.
- Ini menyederhanakan MVP karena hanya perlu satu alur rating (bukan rating berjenjang untuk tiap tipe interaksi), namun perlu diperhatikan sebagai keterbatasan cakupan trust score di fase awal — bisa dipertimbangkan ulang di fase lanjutan jika ditemukan kasus penyalahgunaan di grup komunitas yang tidak tertangani lewat report saja.

#### 5.2.3 Guardrail Anti-"Ojek Online" (Teknis & Produk)

Merujuk pada penegasan batas di bagian 3.1, berikut guardrail konkret yang harus dijaga di level fitur supaya SEARAH tidak bergeser jadi ojek online:

- **Tidak ada "cari driver terdekat sekarang juga"** — semua matching tetap berbasis rute rutin + jadwal yang sudah diposting/disepakati sebelumnya (lihat 5.2.1), bukan dispatch real-time seperti ride-hailing.
- **Pengemudi tidak bisa "menerima order" dari orang yang belum searah alami** — sistem hanya menampilkan kandidat hasil perhitungan corridor/detour (bagian 5.1.1), tidak ada slot terbuka "siapa saja boleh order".
- **Tidak ada leaderboard/gamifikasi yang mendorong "narik sebanyak-banyaknya"** — tidak ada fitur seperti "driver paling banyak antar orang bulan ini", karena ini mengarah ke insentif ala ojek online, bukan menolong karena kebetulan searah.
- **Disclaimer eksplisit di dalam aplikasi**: "SEARAH bukan layanan ojek/taksi online. Ini murni komunitas orang searah yang kebetulan bisa saling bantu." — ditampilkan minimal di layar onboarding dan di layar posting rute carpool.
- Guardrail ini berlaku juga untuk fitur-fitur baru yang diusulkan ke depan (termasuk ide fase lanjutan seperti titik akhir asimetris/transit KRL-TransJakarta, atau perluasan ke aktivitas weekend) — setiap fitur baru perlu dicek ulang terhadap tabel perbandingan di 3.1 sebelum masuk roadmap.

### 5.3 Keamanan Sebagai Fondasi (bukan tambahan)
Karena app ini mempertemukan orang asing secara fisik dan berulang (bukan sekali jalan seperti ride-hailing), **trust & safety harus jadi pilar produk**, bukan fitur pelengkap.

---

## 6. Ide Tambahan dari Saya (Usulan)

Berikut beberapa ide yang saya tambahkan untuk memperkuat konsep Anda:

1. **Verifikasi berlapis (multi-tier trust)** — bukan cuma satu kali verifikasi KTP, tapi ada badge tingkat kepercayaan yang naik seiring waktu (misal: "Terverifikasi KTP", "Terverifikasi Wajah", "Terverifikasi Kantor via email domain perusahaan").
2. **Verifikasi email kantor (corporate email)** — opsional, tapi jadi nilai tambah kepercayaan besar. Orang dengan email @perusahaan.co.id lebih dipercaya karena identitasnya lebih terlacak.
3. **Mode "Grup Dulu, Personal Kemudian"** — pengguna baru default hanya bisa gabung ke grup komunitas rute (banyak orang), bukan langsung chat 1-on-1 dengan orang asing. Fitur 1-on-1/personal match baru terbuka setelah level trust tertentu tercapai. Ini mengurangi risiko predator langsung menyasar individu.
4. **Fitur "Share Trip" ke kontak darurat** — saat janjian bareng teman seperjalanan/carpool, lokasi live bisa dibagikan otomatis ke kontak darurat (mirip fitur Gojek/Grab), meski SEARAH bukan platform transaksi.
5. **Tombol SOS/darurat** dalam app selama sesi perjalanan aktif.
6. **Sistem rating & review dua arah** setelah setiap sesi ketemu/carpool, dengan opsi laporan (report) yang mudah dan tim moderasi yang responsif.
7. **Verifikasi kendaraan** untuk pemilik kendaraan yang menawarkan carpool (foto STNK, plat nomor, foto kendaraan) — agar penumpang tahu apa yang menaikinya sesuai.
8. **Batas & moderasi konten** di grup komunitas (auto-moderasi kata kasar/SARA, laporan cepat, admin komunitas dari pihak SEARAH bukan cuma user).
9. **"Cooling period" untuk chat baru** — mencegah spam/love scam dengan membatasi jumlah chat baru yang bisa dimulai akun baru dalam 24 jam pertama.
10. **Opsi "Wanita hanya dengan wanita"** untuk pengguna yang ingin merasa lebih aman (filter gender pada carpool/1-on-1, tidak berlaku untuk grup komunitas umum).
11. **Deteksi anomali perilaku** — sistem otomatis menandai akun dengan pola mencurigakan (banyak akun baru menghubungi 1 orang tertentu berulang, dsb.) untuk ditinjau tim trust & safety.
12. **Legal disclaimer & posisi hukum jelas** — SEARAH sebagai platform *mempertemukan*, bukan penyedia jasa transportasi berbayar resmi, untuk kejelasan tanggung jawab hukum (perlu review dengan tim legal terkait regulasi angkutan di Indonesia, khususnya jika ada elemen split cost/carpool).

---

## 7. Fitur Utama (Feature List — MVP vs Fase Berikutnya)

### MVP (Fase 1)
- [ ] Registrasi & verifikasi identitas Tingkat 1 — foto KTP + selfie, direview manual, opsional dengan badge insentif (lihat 9.1)
- [ ] Input titik rumah & kantor, pilih moda transportasi
- [ ] Algoritma pencocokan rute searah
- [ ] Grup komunitas otomatis berdasarkan rute/area (teman ngobrol sejalan, tanpa proses accept)
- [ ] Chat grup dasar
- [ ] Profil pengguna dengan badge verifikasi
- [ ] Sistem laporan (report) & blokir pengguna
- [ ] Rating setelah sesi carpool kendaraan pribadi yang di-accept & selesai (lihat 5.2.2 — tidak berlaku untuk teman ngobrol sejalan)

### Fase 2
- [ ] Chat 1-on-1 personal (dibuka setelah trust level tertentu)
- [ ] Fitur carpool: posting rute/offer oleh pengemudi, request dari penumpang, accept/decline (lihat 5.2.1) — verifikasi Tingkat 1 menjadi wajib (Tingkat 2) di fitur ini
- [ ] Verifikasi kendaraan
- [ ] Fitur Share Trip ke kontak darurat + tombol SOS
- [ ] Verifikasi email kantor

### Fase 3
- [ ] Fitur kecocokan personal ala "dating" (dengan minat & preferensi, tetap terbatas pada rute searah)
- [ ] Gamifikasi (poin, streak commuting bareng, achievement)
- [ ] Integrasi kalender kerja untuk jadwal otomatis
- [ ] Jadwal keberangkatan KRL/TransJakarta per stasiun/halte (ide tambahan — lihat 7.1)

#### 7.1 Ide Tambahan: Jadwal Transportasi Umum per Stasiun/Halte

Menampilkan jadwal keberangkatan KRL & TransJakarta langsung di dalam SEARAH (misal di layar komunitas rute KRL/bus), sebagai pelengkap fitur teman ngobrol sejalan — bukan fitur inti, sifatnya nice-to-have.

- **TransJakarta**: tersedia data **GTFS resmi** (format standar dunia untuk jadwal transit publik) yang bisa diakses lewat beberapa mirror terbuka (repositori GitHub komunitas, Transitland, serta data halte resmi di data.go.id). Karena formatnya GTFS standar, bisa langsung pakai library open-source siap pakai (misal `node-gtfs` untuk Node.js atau `gtfs-kit` untuk Python) tanpa perlu bangun parser sendiri.
- **KRL**: **tidak ada API resmi publik** dari KAI Commuter — informasi jadwal hanya tersedia lewat aplikasi/situs resmi mereka (C-Access, kci.id). Ada proyek open-source komunitas (misal repositori "krl" oleh rasyidstat di GitHub) yang mengumpulkan data KRL, tapi sifatnya tidak resmi (kemungkinan hasil scraping) sehingga keandalannya tidak terjamin jangka panjang dan berisiko berhenti berfungsi kalau situs sumber berubah.
- **Rekomendasi implementasi bertahap**:
  1. Fase awal: untuk KRL, cukup jadwal statis yang di-update manual secara berkala oleh tim (dari jadwal resmi GAPEKA yang dipublikasikan KAI), daripada bangun sistem scraping yang rawan rusak.
  2. TransJakarta bisa diimplementasi lebih awal karena datanya resmi & terbuka (GTFS), risikonya jauh lebih rendah dibanding KRL.
  3. Evaluasi ulang kalau KAI Commuter suatu saat merilis API resmi publik.
- Fitur ini murni pelengkap kenyamanan (bukan inti value proposition matching/komunitas SEARAH), jadi prioritasnya di fase lanjutan, bukan MVP.

#### 7.2 Ide Tambahan: Aktivitas Weekend/Leisure Berbasis Trust (Fase 4)

Ide tambahan: karena keresahan awal produk ini ("bosan sendirian di jalan") tidak cuma berlaku Senin–Jumat, dipertimbangkan perluasan ke aktivitas non-commuting (weekend, ke mall, tempat makan) — tapi dengan syarat ketat supaya tidak melemahkan fondasi trust yang sudah dibangun dari fitur commuting:

- **Hanya terbuka untuk pengguna dengan trust level memadai** — sudah aktif & punya rating baik dari fitur commuting/carpool (bagian 5.2.2), bukan dibuka bebas untuk pengguna baru. Trust rutin-berulang dari commuting adalah syarat, karena perjalanan leisure (tujuan berbeda-beda, tidak rutin) sulit membangun trust dari nol.
- **Fokus ke aktivitas non-darurat/leisure dulu** (mall, tempat makan, jalan-jalan santai) — **rumah sakit sengaja dikecualikan** di fase ini karena perjalanan ke RS sering bersifat darurat/mendesak, sementara proses matching butuh waktu untuk konfirmasi kecocokan; mengandalkan SEARAH untuk keadaan darurat medis berisiko. Kalau nanti dipertimbangkan, sebaiknya dibatasi untuk kasus terjadwal (misal antar jenguk keluarga), bukan kondisi gawat darurat.
- **Diposisikan sebagai ekstensi dari koneksi yang sudah terbentuk**, bukan matching baru dari nol untuk keperluan weekend — misalnya hanya bisa mengajak orang yang sudah pernah searah/kenal dari grup commuting yang sama, bukan membuka pool pencarian baru khusus leisure.
- Terkait erat dengan revisi **Kecocokan Personal** di bagian 5.2 poin 4 — basis trust yang sama (histori searah & rating baik dari commuting) dipakai baik untuk kecocokan personal maupun ajakan aktivitas weekend.
- **Tetap tunduk pada guardrail anti-ojek-online** di bagian 5.2.3 — perluasan ke aktivitas apa pun tidak boleh menggeser SEARAH jadi layanan on-demand seperti ride-hailing.

---

## 8. Alur Pengguna (User Flow Utama)

1. **Onboarding** → Daftar akun → Verifikasi KTP & selfie → Isi profil dasar
2. **Setup Rute** → Input titik rumah & kantor → Pilih moda transportasi & jam biasa berangkat/pulang
3. **Matching** → Sistem menampilkan grup komunitas rute & daftar user searah
4. **Interaksi** → Gabung grup / request carpool / (setelah trust level cukup) chat personal
5. **Sesi Perjalanan** → Opsional share live location, tombol SOS aktif selama sesi
6. **Setelah Sesi** → Rating & review, opsi laporkan jika ada masalah

---

## 9. Kebutuhan Keamanan & Kepercayaan (Trust & Safety) — Detail

Karena ini menjadi concern utama Anda, berikut detail requirement-nya:

### 9.1 Proses Registrasi — Model Verifikasi Bertahap

Terinspirasi dari pola Tinder/Bumble (verifikasi ID opsional dengan insentif badge, baru wajib saat ada indikasi risiko), disesuaikan dengan risiko fisik SEARAH yang lebih tinggi (naik kendaraan orang asing berulang, bukan sekadar ketemu di tempat umum sekali). Verifikasi dibagi 3 tingkat sesuai fase pertumbuhan produk:

**Tingkat 1 — Fase awal/validasi (MVP pertama, manual, murah)**
- Foto e-KTP + selfie **direview manual oleh kamu/tim kecil sendiri** — belum pakai API Dukcapil berbayar.
- Verifikasi ini **opsional untuk sekadar gabung komunitas/ngobrol**, tapi memberi badge "terverifikasi" di profil sebagai insentif (mengikuti pola Tinder: pengguna yang menyelesaikan verifikasi ID mendapat lebih banyak match/kepercayaan dibanding yang tidak).
- Nomor HP tetap wajib diverifikasi OTP sejak awal — ini murah dan penting untuk semua pengguna.

**Tingkat 2 — Wajib khusus sebelum accept carpool (titik risiko fisik tertinggi)**
- Begitu pengguna mau **menerima atau mengirim permintaan carpool** (bukan sekadar chat komunitas), verifikasi Tingkat 1 (foto KTP + selfie, direview manual) menjadi **wajib**, bukan opsional lagi — karena di titik inilah orang benar-benar masuk kendaraan orang asing, beda risikonya dengan sekadar ngobrol di grup.
- Ini konsisten dengan insight bahwa proses ngobrol/interaksi di awal (bagian 5.2.1) memang jadi filter utama, tapi titik "accept" tetap butuh satu lapis penguatan tambahan yang lebih dari sekadar chat.

**Tingkat 3 — Fase scale besar (setelah traksi signifikan, upgrade ke eKYC resmi)**
- Setelah volume pengguna terlalu besar untuk direview manual satu-satu, upgrade ke integrasi vendor eKYC resmi terhubung Dukcapil (detail lengkap di 9.1.1 & 9.1.2 di bawah) — validasi otomatis ke database kependudukan, liveness aktif, deteksi dokumen palsu, dsb.
- Detail lengkap di bawah ini (9.1.1, 9.1.2) adalah **target arsitektur untuk Tingkat 3**, disiapkan sebagai roadmap, bukan yang harus dibangun di hari pertama.

#### 9.1.1 Anti-Pemalsuan Identitas (KTP Palsu, KIA, Deepfake) — Target Tingkat 3

Karena rawan disalahgunakan (KTP palsu, KIA/Kartu Identitas Anak dipakai mengaku dewasa, foto/video hasil AI), verifikasi di fase scale besar dirancang berlapis:

1. **Integrasi vendor eKYC resmi yang terhubung Dukcapil** — tidak membangun sendiri dari nol. Gunakan vendor seperti Privy, VIDA, atau Verihubs yang sudah punya akses resmi ke database kependudukan, untuk mencocokkan NIK, nama, dan tanggal lahir ke data resmi negara. Begitu NIK tidak match dengan data Dukcapil, identitas palsu langsung ketahuan.
2. **Liveness detection aktif** — pengguna diminta melakukan gerakan spontan (kedip, gerak kepala, senyum) dengan urutan acak tiap sesi, supaya video pre-recorded/deepfake tidak bisa dipakai ulang.
3. **Deteksi manipulasi dokumen (document tampering)** — analisis gambar KTP untuk tanda edit digital (font tidak konsisten, area blur/tumpuk, posisi elemen tidak sesuai template e-KTP resmi).
4. **Cross-check umur dari format NIK** — NIK e-KTP menyimpan info tanggal lahir; sistem otomatis mencocokkan dengan tanggal lahir yang diinput user, tandai mencurigakan jika tidak cocok.
5. **Deteksi jenis dokumen, tolak selain e-KTP dewasa** — OCR harus mengenali jenis dokumen, bukan cuma membaca teks. Dokumen yang terdeteksi sebagai KIA (Kartu Identitas Anak, untuk di bawah 17 tahun) atau bukan e-KTP otomatis ditolak di awal.
6. **Sinyal perilaku & perangkat** — deteksi banyak akun didaftarkan dari satu perangkat dalam waktu singkat, penggunaan emulator/VPN saat verifikasi, dan velocity check percobaan verifikasi gagal berulang dari IP/device yang sama.
7. **Manual review untuk kasus abu-abu** — skor yang tidak jelas lolos/tidak (misal wajah agak mirip tapi tidak 100% cocok) dieskalasi ke tim Trust & Safety internal, bukan diputuskan otomatis.
8. **Verifikasi berkelanjutan** — pemantauan tetap berjalan setelah registrasi (laporan user lain, pola chat mencurigakan) dapat memicu re-verifikasi ulang, bukan dianggap "selesai selamanya" setelah lolos di awal.

#### 9.1.2 Model Biaya Vendor eKYC — Relevan Mulai Tingkat 3

Bagian ini baru relevan ketika sudah upgrade ke Tingkat 3 (integrasi eKYC resmi). Di Tingkat 1 & 2, biaya verifikasi mendekati nol karena dilakukan manual.

- Vendor eKYC di Indonesia umumnya menggunakan skema **pay-per-use (bayar per verifikasi)**, bukan lisensi putus sekali beli — biaya biasanya terdiri dari biaya integrasi awal, biaya operasional bulanan (jika ada), dan biaya per verifikasi yang diproses.
- Contoh acuan harga pasar: verifikasi pencocokan NIK ke data Dukcapil resmi berkisar sekitar **Rp 4.000 per verifikasi** untuk modul dasar (NIK + nama + tanggal lahir), tanpa biaya setup/langganan bulanan pada skema pay-as-you-go.
- Biaya bertambah seiring jumlah "modul" yang dipakai — OCR KTP, face matching, liveness detection, dan deteksi deepfake masing-masing berkontribusi menambah biaya per transaksi.
- Karena SEARAH tidak memiliki model monetisasi di awal (lihat bagian 13), biaya eKYC ini murni **biaya operasional per pengguna baru** yang perlu dianggarkan terpisah dari biaya server/infrastruktur, dan perlu dibandingkan dari minimal 2-3 vendor (Privy, Verihubs, VIDA) untuk kuotasi harga aktual sesuai volume pendaftar.
- Skema pay-per-use tanpa komitmen bulanan kemungkinan lebih cocok untuk fase awal Jabodetabek, mengingat volume pendaftar belum bisa dipastikan sebelum aplikasi mendapat traksi.
- Kebijakan pemerintah soal akses data Dukcapil juga berpotensi berubah dari gratis menjadi berbayar untuk lembaga pengakses, yang bisa memengaruhi harga vendor eKYC ke depan — perlu dipantau saat negosiasi kontrak vendor.

### 9.2 Selama Penggunaan
- Rate-limit chat baru untuk akun baru (anti-spam/scam)
- Deteksi kata kunci mencurigakan otomatis (moderasi konten)
- Sistem report dengan kategori jelas (pelecehan, penipuan, akun palsu, dll.)
- Tim moderasi manusia untuk tinjau laporan prioritas tinggi (24 jam SLA)
- Riwayat pelaporan memengaruhi trust score akun

### 9.3 Privasi Data
- Data KTP & wajah disimpan terenkripsi, tidak ditampilkan ke pengguna lain (hanya badge "Terverifikasi" yang tampil publik)
- Kepatuhan terhadap UU PDP (Perlindungan Data Pribadi) Indonesia

#### 9.3.1 Penyamaran Lokasi Rumah & Kantor (Location Fuzzing)

Titik rumah/kantor asli **tidak boleh** ditampilkan presisi ke pengguna lain. Pendekatannya:

- **Dua lapis lokasi**:
  - *Titik internal (presisi)* — disimpan terenkripsi, hanya dipakai sistem untuk perhitungan rute, detour, dan matching. Tidak pernah dikirim ke device pengguna lain.
  - *Titik publik (approximate)* — yang ditampilkan di peta/profil ke pengguna lain, berupa titik yang sudah "dikaburkan", bukan lokasi asli.
- **Metode penyamaran titik publik**: snap ke landmark publik terdekat (halte, stasiun, minimarket, gerbang perumahan) atau offset acak dalam radius tertentu (misal 300–500 meter) dari titik asli.
- **Tampilkan sebagai radius/area, bukan pin presisi** — misal "sekitar area X" atau lingkaran radius, bukan alamat lengkap.
- **Progressive disclosure**: lokasi jemput/ketemu yang presisi baru disepakati **manual** oleh kedua pihak lewat chat setelah match & sepakat untuk ketemu/carpool — bukan dibuka otomatis oleh sistem. Ini selaras dengan keputusan split cost yang juga didiskusikan manual via chat (lihat bagian 13).
- **Anti reverse-engineering**: jika titik publik menggunakan offset acak, offset perlu dirotasi berkala (misal tiap minggu) agar tidak membentuk pola berulang yang bisa dipakai menebak lokasi asli. Jika menggunakan snap ke landmark tetap, ini otomatis aman dari analisis pola karena tidak acak.
- **Trade-off desain**: presisi "logic matching" (di backend) dan presisi "apa yang ditampilkan ke user" harus dipisah secara arsitektural sejak awal (skema data terpisah untuk titik internal vs publik), bukan ditambal belakangan — supaya penyamaran privasi tidak mengorbankan akurasi matching.

---

## 10. Kebutuhan Teknis Awal (Tech Stack)

Rekomendasi stack awal, disesuaikan dengan kebutuhan teknis yang muncul dari brainstorming di bagian 5.1.1 (corridor/detour matching), 9.1 (verifikasi eKYC), dan 9.3 (penyamaran lokasi), serta kondisi bisnis SEARAH (tanpa monetisasi, fokus Jabodetabek dulu).

### 10.1 Strategi Platform: Web-First, Mobile Native Kemudian

**Keputusan**: mulai dari **web-based (web app)** dulu, baru dikembangkan ke mobile native setelah tervalidasi. Alasannya: pengembangan & iterasi jauh lebih cepat, satu codebase untuk semua device tanpa proses submit App Store/Play Store, dan cocok untuk fase validasi awal yang butuh kecepatan eksperimen (lihat `Rencana_Validasi_SEARAH.md`).

| Layer | Rekomendasi | Alasan |
|---|---|---|
| Frontend | **Next.js (React + TypeScript)** | Web app dulu, tapi tetap berbasis React — skill & sebagian komponen bisa dipakai ulang kalau nanti pindah/expand ke React Native. |
| Pengalaman mobile sementara | **PWA (Progressive Web App)** | Web app bisa "diinstall" ke homescreen HP dan terasa seperti aplikasi native, tanpa perlu build native dulu — jembatan sebelum ke React Native beneran. |
| Mobile native (fase lanjutan, setelah web tervalidasi) | React Native (TypeScript) | Baru dibangun setelah konsep & fitur inti terbukti jalan di web — bukan dikerjakan paralel dari awal. |
| Backend | Node.js + NestJS (TypeScript) | Tidak berubah — dipakai sama baik untuk web maupun mobile native nanti, tidak perlu dibangun ulang. |
| Database utama | PostgreSQL + ekstensi PostGIS | Wajib, bukan opsional — logika corridor/buffer matching & detour (bagian 5.1.1) murni query geospasial (ST_Buffer, ST_Intersects, ST_Distance). |
| Cache & pre-filter | Redis | Untuk geohash/H3 pre-filter sebelum panggil routing API berbayar, rate-limit OTP/chat, dan session cache. |
| Realtime chat | Socket.io (self-host) atau Firebase Realtime Database | Chat grup komunitas & carpool. Firebase lebih cepat untuk MVP; Socket.io lebih hemat biaya jangka panjang di volume besar. |
| Storage file | S3-compatible (AWS S3 atau alternatif lokal) | Foto KTP & selfie, wajib terenkripsi (lihat bagian 9.3). |
| Peta & routing | Google Maps Directions/Distance Matrix API, dengan OSRM self-host sebagai opsi hemat biaya | Traffic-aware ETA penting untuk logika detour (bagian 5.1.1). |
| Verifikasi identitas | API vendor eKYC (Privy/Verihubs/VIDA) | Tidak dibangun sendiri — lihat bagian 9.1.1 & 9.1.2. |
| Hosting/infrastruktur | Cloud dengan region Singapura/Jakarta (AWS ap-southeast-1, GCP asia-southeast2) | Latensi rendah untuk pengguna Jabodetabek. |
| CI/CD | GitHub Actions | Gratis untuk repo kecil-menengah, terintegrasi langsung dengan GitHub. |

### 10.2 Keterbatasan Web-First yang Perlu Disadari

- **GPS/live location tracking (share trip) lebih terbatas di web** dibanding native mobile — browser bisa akses GPS, tapi kurang reliable kalau browser di-minimize atau layar HP dikunci. Untuk fase web, fitur share trip cukup dijalankan selama tab/PWA aktif di layar, dengan catatan keterbatasan ini ke pengguna.
- **Push notification di web** (chat baru, permintaan carpool) bisa lewat Web Push API, tapi pengalamannya tidak seseamless notifikasi native — perlu dikelola ekspektasinya sejak awal, terutama di iOS Safari yang dukungan Web Push-nya lebih terbatas.
- **Kamera untuk foto KTP/selfie** (verifikasi Tingkat 1) tetap bisa diakses lewat browser (`<input type="file" capture>` atau WebRTC) tanpa masalah berarti.
- Wireframe 6 layar yang sudah dibuat (`searah_wireframe.html`) tetap relevan sebagai referensi alur & konten — hanya perlu disesuaikan jadi layout responsive web (bukan komponen native mobile) saat implementasi.

**Pertimbangan khusus untuk kondisi SEARAH:**
- Karena **tidak ada model monetisasi** (lihat bagian 13), pilih layanan dengan tier gratis/murah dulu (Firebase, Redis Cloud free tier, PostgreSQL di Supabase/Railway, Vercel untuk hosting Next.js) sebelum pindah ke infrastruktur self-managed yang lebih mahal tapi lebih hemat di skala besar.
- Pertimbangkan **monorepo** (frontend + backend satu repo) untuk memudahkan tim kecil mengelola deployment di fase awal Jabodetabek.
- Daftar environment variable lengkap sesuai stack ini tersedia terpisah di file `.env.example` (database, Maps API, eKYC vendor, storage, notifikasi, feature flags per fase).

## 11. Metrik Keberhasilan (KPI)

- Jumlah pengguna aktif bulanan (MAU)
- Tingkat kecocokan berhasil (match rate) per rute
- Jumlah sesi carpool/teman jalan yang terjadi per minggu
- Rating rata-rata pengguna
- Tingkat retensi 30 hari
- Jumlah laporan (report) per 1000 interaksi (indikator keamanan — makin rendah makin baik)

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Penyalahgunaan untuk niat jahat (penipuan, pelecehan, kejahatan fisik) | Verifikasi berlapis, trust level, moderasi aktif, tombol SOS |
| Isu regulasi (dianggap angkutan ilegal) | Posisi sebagai platform sosial/komunitas, bukan penyedia jasa angkutan berbayar; split cost bukan tarif komersial; konsultasi legal |
| Density pengguna rendah di area tertentu (rute sepi peminat) | Mulai dari beberapa area/koridor komuter padat (contoh: Jabodetabek KRL, Tol Dalam Kota) sebelum ekspansi |
| Kebocoran data pribadi (lokasi rumah, KTP) | Enkripsi data, kebijakan privasi ketat, kepatuhan UU PDP |
| Ketergantungan pada akurasi API peta pihak ketiga | Uji multiple provider (Google Maps, OSRM) dan fallback |
| Biaya operasional verifikasi eKYC membengkak seiring pertumbuhan user, padahal tidak ada monetisasi | Pilih skema pay-per-use tanpa komitmen bulanan di fase awal, bandingkan minimal 2-3 vendor, pantau kebijakan biaya akses Dukcapil (lihat bagian 9.1.2) |

---

## 13. Keputusan Produk (Hasil Diskusi Stakeholder)

| Pertanyaan | Keputusan | Implikasi |
|---|---|---|
| Cakupan wilayah awal | **Jabodetabek** dulu, ekspansi nasional/kota lain menyusul setelah traksi/viral | Data rute, algoritma matching, dan komunitas awal difokuskan ke koridor komuter Jabodetabek (KRL, TransJakarta, tol dalam kota/luar kota, dsb). Infrastruktur tetap dibuat scalable agar mudah dibuka ke kota lain tanpa rombak ulang. |
| Model monetisasi | **Tidak ada monetisasi di awal** — fokus growth & viralitas dulu | MVP fokus penuh ke akuisisi pengguna & retensi, bukan revenue. Monetisasi (jika ada) dipertimbangkan di fase lanjutan setelah basis pengguna cukup besar — perlu PRD/diskusi terpisah nanti. |
| Pembayaran/split cost carpool | **Tidak difasilitasi otomatis oleh sistem** — kesepakatan split biaya (bensin, tol, dll.) menjadi diskusi personal antar pengguna lewat fitur chat | SEARAH murni menjadi fasilitator pertemuan & komunikasi, bukan pihak yang memproses pembayaran. Ini juga memperkuat posisi hukum SEARAH sebagai platform sosial, bukan penyedia jasa angkutan berbayar (lihat bagian 11 — Risiko Regulasi). Perlu ditambahkan disclaimer di dalam chat/app bahwa kesepakatan biaya adalah tanggung jawab pribadi antar pengguna, di luar tanggung jawab SEARAH. |
| Moderasi konten & laporan | **Tim internal** yang menangani, bukan outsource | Perlu dibentuk fungsi/tim Trust & Safety internal sejak fase MVP (walau kecil), dengan SLA penanganan laporan (lihat bagian 9.2). Ini penting mengingat sensitivitas keamanan produk ini — moderasi tidak bisa dianggap fitur sekunder. |

### Catatan Tambahan dari Keputusan Ini
- Karena **split cost dilakukan manual via chat**, penting untuk menambahkan **disclaimer eksplisit** di dalam UI chat (khususnya saat topik carpool/tumpangan dibahas) yang mengingatkan pengguna bahwa transaksi finansial adalah kesepakatan pribadi, di luar tanggung jawab dan pengawasan SEARAH.
- Karena skala awal **Jabodetabek**, disarankan mulai dari 1–2 koridor komuter terpadat dulu (misal jalur KRL Bekasi–Sudirman atau BSD–SCBD) untuk memastikan kepadatan pengguna cukup agar matching berhasil, baru diperluas ke koridor lain di Jabodetabek sebelum ekspansi nasional.

---

*Dokumen ini adalah draft awal dan terbuka untuk direvisi berdasarkan diskusi lebih lanjut, riset pengguna, dan validasi pasar.*

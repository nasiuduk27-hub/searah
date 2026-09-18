// ponytail: nav MVP, ganti dengan 6 layar wireframe saat bangun UI final.
const LINKS = [
  ['/register', 'Daftar + OTP'],
  ['/verifikasi', 'Verifikasi KTP/selfie'],
  ['/profil', 'Profil + badge'],
  ['/rute', 'Setup rute'],
  ['/temukan', 'Temukan searah'],
  ['/komunitas', 'Komunitas + chat'],
  ['/aman', 'Lapor & blokir'],
  ['/rating', 'Rating carpool'],
  ['/pesan', 'Pesan personal'],
  ['/carpool', 'Carpool'],
  ['/kendaraan', 'Verifikasi kendaraan'],
  ['/darurat', 'Darurat + SOS'],
  ['/kantor', 'Email kantor'],
  ['/personal', 'Kenal lebih jauh'],
  ['/streak', 'Streak saya'],
  ['/jadwal', 'Jadwal kerja'],
  ['/transit', 'Jadwal transit'],
  ['/weekend', 'Weekend bareng'],
];
export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1>SEARAH</h1>
      <p>Nggak ada lagi jalan pulang kerja yang sepi.</p>
      <p style={{ opacity: 0.7 }}>
        SEARAH bukan layanan ojek/taksi online. Ini murni komunitas orang searah yang kebetulan bisa
        saling bantu.
      </p>
      <ul>
        {LINKS.map(([href, label]) => (
          <li key={href}><a href={href}>{label}</a></li>
        ))}
      </ul>
    </main>
  );
}

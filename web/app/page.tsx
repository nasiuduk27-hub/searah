// ponytail: halaman placeholder MVP, ganti dengan 6 layar wireframe saat bangun UI.
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
        <li>MVP 1: registrasi + verifikasi KTP/selfie (review manual)</li>
        <li>MVP 2: setup rute rumah–kantor + moda</li>
        <li>MVP 3: komunitas rute + chat grup + report/block</li>
      </ul>
    </main>
  );
}

export const metadata = {
  title: "SEARAH — Teman Seperjalanan Kerja",
  description: "Temukan teman searah pulang-pergi kerja di Jabodetabek.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "system-ui", margin: 0 }}>{children}</body>
    </html>
  );
}

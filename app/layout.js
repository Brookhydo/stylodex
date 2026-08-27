import "./globals.css";

export const metadata = {
  title: "Le Plumier — catalogue de stylos",
  description: "Le catalogue de la collection de stylos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;1,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-navy text-paper font-sans">{children}</body>
    </html>
  );
}

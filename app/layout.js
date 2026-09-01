import './globals.css'

export const metadata = {
  title: 'Stylodex',
  description: 'Le carnet de collection de vos stylos Legami',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DermAI - Diagnostic Dermatologique par IA',
  description: 'Obtenez un diagnostic précis de votre peau en quelques minutes grâce à l\'intelligence artificielle avancée. Recommandations personnalisées et routine sur-mesure.',
  keywords: ['dermatologie', 'intelligence artificielle', 'diagnostic peau', 'skincare', 'analyse dermatologique', 'routine beauté'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

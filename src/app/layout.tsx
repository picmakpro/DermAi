import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DermAI V2 - Diagnostic Dermatologique IA',
  description: 'Analyse précise de votre peau avec intelligence artificielle avancée',
  keywords: ['dermatologie', 'IA', 'diagnostic', 'peau', 'skincare'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}

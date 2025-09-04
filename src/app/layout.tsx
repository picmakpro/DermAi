import type { Metadata } from 'next'
import { Inter, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// Fonts according to new artistic direction
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DermAI - AI Dermatological Diagnosis',
  description: 'Get a precise skin diagnosis in minutes with advanced artificial intelligence. Personalized recommendations and custom routine.',
  keywords: ['dermatology', 'artificial intelligence', 'skin diagnosis', 'skincare', 'dermatological analysis', 'beauty routine'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}

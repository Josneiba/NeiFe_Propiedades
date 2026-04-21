import type { Metadata } from 'next'
import { Cormorant_Garamond, Outfit, DM_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/app/providers'
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  weight: ['300', '400', '500', '600'],
  variable: '--font-heading'
})

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-body'
})

const dmMono = DM_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'NeiFe Propiedades | Gestión de arriendos',
  description: 'Plataforma para propietarios, arrendatarios y corredores de propiedades. Gestión integral de arriendos sin intermediarios.',
  keywords: ['arriendo', 'propiedades', 'gestión', 'corredores', 'propietarios', 'arrendatarios', 'chile'],
  authors: [{ name: 'NeiFe' }],
  creator: 'NeiFe',
  publisher: 'NeiFe',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://neife.cl'),
  openGraph: {
    title: 'NeiFe Propiedades | Gestión de arriendos',
    description: 'Plataforma para propietarios, arrendatarios y corredores de propiedades',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://neife.cl',
    siteName: 'NeiFe Propiedades',
    locale: 'es_CL',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NeiFe Propiedades - Gestión de arriendos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeiFe Propiedades | Gestión de arriendos',
    description: 'Plataforma para propietarios, arrendatarios y corredores de propiedades',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning style={{ colorScheme: 'dark' }}>
      <body suppressHydrationWarning className={`${cormorant.variable} ${outfit.variable} ${dmMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

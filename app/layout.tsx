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
  title: 'NeiFe - Gestión de Arriendos',
  description: 'Plataforma digital para gestión integral de propiedades en arriendo. Elimina intermediarios y digitaliza todo el proceso.',
  generator: 'v0.app',
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
      <body className={`${cormorant.variable} ${outfit.variable} ${dmMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

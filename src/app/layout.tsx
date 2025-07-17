import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import SecurityBanner from '@/components/common/SecurityBanner'
import './globals.css'

// Configure fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins', 
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Heart Harbor - Family Communication Coach',
  description: 'AI-powered family communication coach that helps children and parents build stronger emotional connections through safe, supportive conversations.',
  keywords: [
    'family communication',
    'emotional support', 
    'children communication',
    'family coaching',
    'parent support',
    'emotional intelligence',
    'family wellness',
    'communication skills',
    'parent insights',
    'child development'
  ].join(', '),
  authors: [{ name: 'Heart Harbor Team' }],
  creator: 'Heart Harbor',
  publisher: 'Heart Harbor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://heart-harbor.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Heart Harbor - Family Communication Coach',
    description: 'AI-powered family communication coach that helps children and parents build stronger emotional connections through safe, supportive conversations.',
    url: 'https://heart-harbor.com',
    siteName: 'Heart Harbor',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Heart Harbor - Family Communication Coach',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heart Harbor - Family Communication Coach',
    description: 'AI-powered family communication coach that helps children and parents build stronger emotional connections.',
    images: ['/twitter-image.jpg'],
    creator: '@heart_harbor',
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
    google: 'verification_token_here',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8B5CF6' },
    { media: '(prefers-color-scheme: dark)', color: '#8B5CF6' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Additional meta tags for mental health compliance */}
        <meta name="disclaimer" content="This AI tool is designed for family communication support and is not a substitute for professional counseling or medical advice." />
        <meta name="privacy-policy" content="Secure platform - all conversations are encrypted and protected." />
        <meta name="age-appropriate" content="Designed for families with children ages 3-18 with parental supervision." />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-white text-gray-900 overflow-x-hidden`}>
        {/* Global accessibility improvements */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-purple-600 text-white p-2 z-50"
        >
          Skip to main content
        </a>
        
        <div id="main-content" className="min-h-screen">
          {children}
        </div>

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Security Notice */}
        <SecurityBanner />

        {/* Support Resources Banner (if needed) */}
        <div className="hidden" id="support-banner">
          <div className="bg-red-600 text-white p-4 text-center">
            <p className="font-medium">
              If you need immediate crisis support, please call 988 (Suicide & Crisis Lifeline) 
              or contact a mental health professional.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
} 
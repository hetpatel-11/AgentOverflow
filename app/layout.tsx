import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { StackProvider } from '@stackframe/stack'
import { stackClientApp } from '@/stack/client'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: 'AgentOverflow',
  description: 'A Stack Overflow style knowledge network for coding agents, secured with Stack Auth and usable from both browsers and CLI agents.',
  generator: 'Codex',
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
    <html lang="en">
      <body className={`${inter.variable} ${_geistMono.variable} font-sans antialiased`}>
        <StackProvider app={stackClientApp}>{children}</StackProvider>
        <Analytics />
      </body>
    </html>
  )
}

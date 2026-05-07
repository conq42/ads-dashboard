import { Syne, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })
const dmMono = DM_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-dm-mono', display: 'swap' })

export const metadata = {
  title: 'AdsAI — Agency Dashboard',
  description: 'Meta · Google Ads · GA4 — Live Performance Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}>
        {children}
      </body>
    </html>
  )
}

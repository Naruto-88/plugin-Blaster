import './globals.css'
import { ReactNode } from 'react'
import Providers from './providers'

export const metadata = {
  title: 'WP Update Monitor',
  description: 'Monitor WP core and plugin updates'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

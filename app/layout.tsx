import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { EnvironmentProvider } from '@/lib/environment-context' // correct client import

export const metadata = {
  title: 'Dashboard',
  description: 'Your dashboard app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="font-sans antialiased">
        {/* Wrap children in the EnvironmentProvider */}
        <EnvironmentProvider>
          {children}
          <Analytics />
        </EnvironmentProvider>
      </body>
    </html>
  )
}

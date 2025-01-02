import '@/styles/globals.css'
import '@/styles/reset.css'

import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

const interFont = Inter({
   subsets: ['latin'],
   weight: ['400', '500', '600', '700'],
   variable: '--font-inter',
   preload: true
})

export const metadata: Metadata = {
   metadataBase: new URL(`https://${process.env.VERCEL_URL}`)
} as Metadata

export default async function Root({
   children
}: Readonly<{
   children: React.ReactNode
}>) {
   return (
      <html lang="pt-BR" className="antialiased">
         <body id="root" className={cn(interFont.variable)}>
            {children}
            <Toaster />
         </body>
      </html>
   )
}

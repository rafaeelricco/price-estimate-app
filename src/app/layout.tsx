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
   metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
   title: {
      default:
         'Calculadora de Preços para Freelancers | Estimativa Inteligente com IA',
      template: '%s | Calculadora de Preços para Freelancers'
   },
   description:
      'Calcule o preço justo para seus projetos freelance com ajuda de IA. Análise detalhada de custos, margem de segurança e recomendações personalizadas para precificação profissional.',
   keywords: [
      'calculadora freelancer',
      'preço projeto freelance',
      'estimativa de custos',
      'precificação projetos',
      'análise de preços com IA',
      'calculadora desenvolvimento',
      'orçamento freelancer',
      'taxa horária freelancer'
   ],
   authors: [
      {
         name: 'Rafael Ricco',
         url: 'https://github.com/rafaeelricco'
      }
   ],
   creator: 'Rafael Ricco',
   openGraph: {
      type: 'website',
      locale: 'pt_BR',
      title: 'Calculadora de Preços para Freelancers com IA',
      description:
         'Calcule o preço justo para seus projetos freelance com análise de IA. Obtenha estimativas precisas e recomendações personalizadas.',
      siteName: 'Calculadora Freelancer'
   },
   twitter: {
      card: 'summary_large_image',
      title: 'Calculadora de Preços para Freelancers com IA',
      description:
         'Calcule o preço justo para seus projetos freelance com análise de IA. Obtenha estimativas precisas e recomendações personalizadas.',
      creator: '@seuhandle'
   },
   robots: {
      index: true,
      follow: true,
      googleBot: {
         index: true,
         follow: true,
         'max-video-preview': -1,
         'max-image-preview': 'large',
         'max-snippet': -1
      }
   }
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

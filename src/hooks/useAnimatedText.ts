'use client'

import * as React from 'react'

import { animate } from 'motion'

import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
   breaks: true,
   html: true,
   linkify: true,
   typographer: true
})

export function useAnimatedText(text: string) {
   const [cursor, setCursor] = React.useState(0)
   const [startingCursor, setStartingCursor] = React.useState(0)
   const [prevText, setPrevText] = React.useState(text)

   if (prevText !== text) {
      setPrevText(text)
      setStartingCursor(text.startsWith(prevText) ? cursor : 0)
   }

   React.useEffect(() => {
      const controls = animate(startingCursor, text.length, {
         duration: 0.1, // Reduzindo ainda mais para melhor feedback
         ease: 'linear',
         onUpdate(latest) {
            setCursor(Math.floor(latest))
         }
      })

      return () => controls.stop()
   }, [startingCursor, text])

   // Processa o texto atual com markdown
   const formattedText = React.useMemo(() => {
      const currentText = text.slice(0, cursor)

      // Identifica seções por cabeçalhos específicos
      const sections = currentText.split(
         /(?=VALOR_SUGERIDO:|EXPLICAÇÃO:|ANÁLISE_DE_MERCADO:|FATORES:|RECOMENDAÇÕES:)/g
      )

      const processedSections = sections.map((section, index) => {
         // Processa cada seção individualmente
         const trimmedSection = section.trim()

         // Se a seção começa com um dos cabeçalhos conhecidos, formata como título
         const formattedSection = trimmedSection.replace(
            /^(VALOR_SUGERIDO|EXPLICAÇÃO|ANÁLISE_DE_MERCADO|FATORES|RECOMENDAÇÕES):/,
            '### $1:'
         )

         // Formata listas
         const withLists = formattedSection.replace(/^- /gm, '* ')

         return md.render(withLists)
      })

      return processedSections.join('')
   }, [text, cursor])

   return formattedText
}

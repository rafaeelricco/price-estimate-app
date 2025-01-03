'use client'

import * as React from 'react'

import { animate } from 'motion'

import MarkdownIt from 'markdown-it'

const delimiter = '' // or " " to split by word
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
      const controls = animate(startingCursor, text.split(delimiter).length, {
         duration: 0.5, // Reduzindo a duração para melhor experiência
         ease: 'linear',
         onUpdate(latest) {
            setCursor(Math.floor(latest))
         }
      })

      return () => controls.stop()
   }, [startingCursor, text])

   // Processa o texto atual com markdown
   const formattedText = React.useMemo(() => {
      const currentText = text.split(delimiter).slice(0, cursor).join(delimiter)

      // Tenta identificar e preservar seções incompletas
      const sections = currentText.split(/\n(?=\w+:)/g)
      const processedSections = sections.map((section, index) => {
         // Mantém a última seção sem formatação se estiver incompleta
         if (
            index === sections.length - 1 &&
            !text
               .split(delimiter)
               .slice(cursor)
               .join(delimiter)
               .startsWith('\n')
         ) {
            return section
         }
         return md.render(section)
      })

      return processedSections.join('\n')
   }, [text, cursor])

   return formattedText
}

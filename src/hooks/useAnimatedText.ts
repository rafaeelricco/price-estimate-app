'use client'

import * as React from 'react'

import { animate } from 'motion'

const delimiter = '' // or " " to split by word

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
         duration: 5, // Reduzindo a duração para melhor experiência
         ease: 'easeInOut',
         onUpdate(latest) {
            setCursor(Math.floor(latest))
         }
      })

      return () => controls.stop()
   }, [startingCursor, text])

   // Simplificar o processamento do texto sem markdown
   const formattedText = React.useMemo(() => {
      const currentText = text.split(delimiter).slice(0, cursor).join(delimiter)
      return currentText
   }, [text, cursor])

   return formattedText
}

/**
 *  @title Animated Text Hook
 *  @notice A custom React hook that creates a typing animation effect for text
 *  @dev Uses the motion library for animation control and React's useState and useEffect hooks
 */

import * as React from 'react'

import { animate } from 'motion'

/** @dev Empty string delimiter for character-by-character animation */
const delimiter = '' // or " " to split by word

/**
 *  @notice Creates an animated typing effect for the provided text
 *  @param text The string to be animated
 *  @return The partially revealed text based on the animation progress
 */
export function useAnimatedText(text: string) {
   /** @dev Initialize states for cursor position and text tracking */
   const [cursor, setCursor] = React.useState(0)
   const [startingCursor, setStartingCursor] = React.useState(0)
   const [prevText, setPrevText] = React.useState(text)

   /** @dev Handle text changes by updating previous text and determining starting position */
   if (prevText !== text) {
      setPrevText(text)
      setStartingCursor(text.startsWith(prevText) ? cursor : 0)
   }

   /** @dev Set up animation effect when text or starting position changes */
   React.useEffect(() => {
      /** @dev Create animation controls for cursor movement */
      const controls = animate(startingCursor, text.split(delimiter).length, {
         duration: 10,
         ease: 'easeOut',
         onUpdate(latest) {
            setCursor(Math.floor(latest))
         }
      })

      /** @dev Cleanup function to stop animation when component unmounts */
      return () => controls.stop()
   }, [startingCursor, text])

   /** @dev Return the partially revealed text based on current cursor position */
   return text.split(delimiter).slice(0, cursor).join(delimiter)
}

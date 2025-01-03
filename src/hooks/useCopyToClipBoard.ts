/**
 *  @title Copy to Clipboard Hook
 *  @notice A custom React hook that provides clipboard functionality with a temporary success state
 *  @dev Uses the navigator.clipboard API and handles timeouts for the copied state
 */

import * as React from 'react'

/**
 *  @notice Creates a copy to clipboard function with success state
 *  @param timeout Duration in milliseconds to show the copied state
 *  @param onCopy Optional callback function to execute after successful copy
 *  @return Object containing isCopied state and copyToClipboard function
 */
export function useCopyToClipboard({
   timeout = 2000,
   onCopy
}: {
   timeout?: number
   onCopy?: () => void
} = {}) {
   /** @dev State to track if content was successfully copied */
   const [isCopied, setIsCopied] = React.useState(false)

   /** @dev Function to handle copying text to clipboard
    *  @param value The string to be copied
    */
   const copyToClipboard = (value: string) => {
      /** @dev Check for browser environment and clipboard support */
      if (typeof window === 'undefined' || !navigator.clipboard.writeText) {
         return
      }

      /** @dev Validate input value */
      if (!value) return

      /** @dev Execute copy operation and handle success state */
      navigator.clipboard.writeText(value).then(() => {
         setIsCopied(true)
         if (onCopy) {
            onCopy()
         }
         setTimeout(() => {
            setIsCopied(false)
         }, timeout)
      }, console.error)
   }

   return { isCopied, copyToClipboard }
}

/**
 *  @title Disclosure Hook
 *  @notice A custom React hook for managing open/closed states with memoized handlers
 *  @dev Uses React.useState and React.useCallback for optimal performance
 */

import * as React from 'react'

/**
 *  @notice Creates a disclosure state with handlers
 *  @param initial Initial state of the disclosure
 *  @return Object containing state and state handlers
 */
export const useDisclosure = (initial = false) => {
   /** @dev State to track open/closed status */
   const [isOpen, setIsOpen] = React.useState(initial)

   /** @dev Memoized handlers for state changes */
   const open = React.useCallback(() => setIsOpen(true), [])
   const close = React.useCallback(() => setIsOpen(false), [])
   const toggle = React.useCallback(() => setIsOpen((state) => !state), [])

   return { isOpen, open, close, toggle }
}

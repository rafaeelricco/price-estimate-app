/**
 *  @title Mobile Detection Hook
 *  @notice A custom React hook that detects if the viewport is mobile-sized
 *  @dev Uses matchMedia API to detect viewport width
 */

import * as React from 'react'

/** @dev Mobile breakpoint in pixels */
const MOBILE_BREAKPOINT = 768

/**
 *  @notice Creates a mobile detector
 *  @return Boolean indicating if viewport is mobile-sized
 */
export const useIsMobile = () => {
   /** @dev Initialize mobile state as undefined */
   const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
      undefined
   )

   /** @dev Set up mobile detection effect */
   React.useEffect(() => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
         setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
      mql.addEventListener('change', onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => mql.removeEventListener('change', onChange)
   }, [])

   return !!isMobile
}

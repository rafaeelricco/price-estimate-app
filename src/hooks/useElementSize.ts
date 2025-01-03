/**
 *  @title Element Size Hook
 *  @notice A custom React hook that tracks an element's dimensions using ResizeObserver
 *  @dev Uses generic type parameter for HTML element type flexibility
 */

import * as React from 'react'

/** @dev Interface for element dimensions */
interface ElementSize {
   width: number
   height: number
}

/**
 *  @notice Creates a ref and tracks element dimensions
 *  @dev Uses ResizeObserver API to monitor size changes
 *  @return Object containing ref and current dimensions
 */
export const useElementSize = <T extends HTMLElement>() => {
   /** @dev Initialize state for element dimensions */
   const [dimensions, setDimensions] = React.useState<ElementSize>({
      width: 0,
      height: 0
   })

   /** @dev Create ref for element tracking */
   const elementRef = React.useRef<T | null>(
      null
   ) as React.MutableRefObject<T | null>

   /** @dev Set up resize observer effect */
   React.useEffect(() => {
      const element = elementRef.current
      if (!element) return

      /** @dev Create and configure ResizeObserver */
      const resizeObserver = new ResizeObserver((entries) => {
         for (const entry of entries) {
            const { width, height } = entry.contentRect
            setDimensions({ width, height })
         }
      })

      resizeObserver.observe(element)

      /** @dev Cleanup observer on unmount */
      return () => {
         resizeObserver.disconnect()
      }
   }, [])

   return { ref: elementRef, ...dimensions }
}

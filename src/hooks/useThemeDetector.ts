/**
 *  @title Theme Detector Hook
 *  @notice A custom React hook that detects and tracks system theme preferences
 *  @dev Uses matchMedia API to detect system dark mode preference
 */

import React from 'react'

/**
 *  @notice Creates a theme detector
 *  @return Object containing current theme ('dark' | 'light')
 */
const useThemeDetector = (): { theme: 'dark' | 'light' } => {
   /** @dev Helper function to get current theme */
   const getCurrentTheme = () => {
      if (typeof window === 'undefined') return false
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      return mediaQuery.matches
   }

   /** @dev Initialize theme state */
   const [isDarkTheme, setIsDarkTheme] = React.useState(getCurrentTheme())

   /** @dev Media query change handler */
   const mqListener = (e: MediaQueryListEvent) => {
      setIsDarkTheme(e.matches)
   }

   /** @dev Set up theme detection effect */
   React.useEffect(() => {
      if (typeof window === 'undefined') return
      const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')
      darkThemeMq.addListener(mqListener)
      return () => darkThemeMq.removeListener(mqListener)
   }, [])

   return {
      theme: isDarkTheme ? 'dark' : 'light'
   }
}

export { useThemeDetector }

import React from 'react'

const useThemeDetector = (): { theme: 'dark' | 'light' } => {
   const getCurrentTheme = () => {
      if (typeof window === 'undefined') return false
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      return mediaQuery.matches
   }

   const [isDarkTheme, setIsDarkTheme] = React.useState(getCurrentTheme())
   const mqListener = (e: MediaQueryListEvent) => {
      setIsDarkTheme(e.matches)
   }

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

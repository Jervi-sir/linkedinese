import { useEffect, useState } from 'react'

import { loadStoredTheme, saveStoredTheme } from '@/lib/storage'

export function useThemePreference() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => loadStoredTheme())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    saveStoredTheme(theme)
  }, [theme])

  return {
    theme,
    setTheme: (nextTheme: 'light' | 'dark') => setThemeState(nextTheme),
  }
}

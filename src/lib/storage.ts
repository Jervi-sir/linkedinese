const apiKeyStorageKey = 'linkedinese_gemini_api_key'
const modelStorageKey = 'linkedinese_gemini_model'
const themeStorageKey = 'linkedinese_theme'

function readStorage(key: string) {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(key) || ''
}

function writeStorage(key: string, value: string) {
  if (typeof window === 'undefined') {
    return
  }

  if (value) {
    window.localStorage.setItem(key, value)
    return
  }

  window.localStorage.removeItem(key)
}

function obfuscate(str: string) {
  if (!str) return ''
  return btoa(str.split('').reverse().join(''))
}

function deobfuscate(str: string) {
  if (!str) return ''
  try {
    return atob(str).split('').reverse().join('')
  } catch {
    // If it's not base64/obfuscated (migration from plain text)
    return str
  }
}

export function loadStoredApiKey() {
  const stored = readStorage(apiKeyStorageKey)
  return deobfuscate(stored)
}

export function saveStoredApiKey(value: string) {
  writeStorage(apiKeyStorageKey, obfuscate(value))
}

export function loadStoredModel() {
  return readStorage(modelStorageKey)
}

export function saveStoredModel(value: string) {
  writeStorage(modelStorageKey, value)
}

export function loadStoredTheme() {
  const storedTheme = readStorage(themeStorageKey)
  return storedTheme === 'light' ? 'light' : 'dark'
}

export function saveStoredTheme(value: 'light' | 'dark') {
  writeStorage(themeStorageKey, value)
}

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

export function loadStoredApiKey() {
  return readStorage(apiKeyStorageKey)
}

export function saveStoredApiKey(value: string) {
  writeStorage(apiKeyStorageKey, value)
}

export function loadStoredModel() {
  return readStorage(modelStorageKey)
}

export function saveStoredModel(value: string) {
  writeStorage(modelStorageKey, value)
}

export function loadStoredTheme() {
  const storedTheme = readStorage(themeStorageKey)
  return storedTheme === 'dark' ? 'dark' : 'light'
}

export function saveStoredTheme(value: 'light' | 'dark') {
  writeStorage(themeStorageKey, value)
}

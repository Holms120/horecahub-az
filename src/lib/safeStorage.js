// localStorage is not always reachable. In iOS Safari with "Block All Cookies",
// in strict-mode Firefox, and inside the Instagram / Facebook / Telegram in-app
// WebViews, touching `window.localStorage` throws SecurityError — the getter
// itself, before any method call. An unguarded read at module scope therefore
// aborts module evaluation, and since main.jsx imports i18n before it renders,
// the whole app fails to boot into a blank page on every route. React never
// mounts, so <ErrorBoundary> cannot catch it either.
//
// These helpers never throw; callers get null / false instead.

export function storageGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function storageRemove(key) {
  try {
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// Convenience for JSON payloads — also swallows parse errors on corrupt values.
export function storageGetJSON(key, fallback) {
  const raw = storageGet(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

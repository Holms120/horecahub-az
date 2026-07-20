import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import az from './az.json'
import ru from './ru.json'
import en from './en.json'
import { storageGet } from '../lib/safeStorage'

i18n.use(initReactI18next).init({
  resources: { az: { translation: az }, ru: { translation: ru }, en: { translation: en } },
  // Must not touch localStorage directly: this runs at module scope, before
  // React mounts, so a SecurityError here blanks the entire app. See safeStorage.
  lng: storageGet('lang') || 'az',
  fallbackLng: 'az',
  interpolation: { escapeValue: false }
})

export default i18n

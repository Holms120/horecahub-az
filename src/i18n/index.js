import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import az from './az.json'
import ru from './ru.json'
import en from './en.json'

i18n.use(initReactI18next).init({
  resources: { az: { translation: az }, ru: { translation: ru }, en: { translation: en } },
  lng: localStorage.getItem('lang') || 'az',
  fallbackLng: 'az',
  interpolation: { escapeValue: false }
})

function syncCrispLocale(lang) {
  if (window.$crisp) {
    const crispLang = lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : 'az'
    window.$crisp.push(['config', 'locale', [crispLang]])
  }
}

syncCrispLocale(i18n.language)
i18n.on('languageChanged', syncCrispLocale)

export default i18n

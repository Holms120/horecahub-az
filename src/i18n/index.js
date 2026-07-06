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
  const messages = {
    az: 'Horeca ilə bağlı suallarınızı bizə ünvanlayın. Sizə ən qısa zamanda geri dönüş edəcəyik 🙏',
    ru: 'Задайте нам ваш вопрос о HoReCa. Мы ответим вам в ближайшее время 🙏',
    en: 'Send us your HoReCa related question. We will get back to you as soon as possible 🙏',
  }

  if (window.$crisp) {
    window.$crisp.push(['config', 'locale', [lang === 'az' ? 'az' : lang === 'ru' ? 'ru' : 'en']])

    const sendWelcome = () => {
      if (localStorage.getItem('crisp_welcome_sent')) return
      window.$crisp.push(['do', 'message:show', ['text', messages[lang] || messages['en']]])
      localStorage.setItem('crisp_welcome_sent', 'true')
    }

    if (!window.__crispWelcomeListenerRegistered) {
      window.__crispWelcomeListenerRegistered = true
      window.$crisp.push(['on', 'session:loaded', sendWelcome])
    }
  }
}

syncCrispLocale(i18n.language)
i18n.on('languageChanged', syncCrispLocale)

export default i18n

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t, i18n } = useTranslation()

  function translateError(msg) {
    if (!msg) return msg
    const lang = i18n.language?.startsWith('ru') ? 'ru' : i18n.language?.startsWith('en') ? 'en' : 'az'
    const errors = {
      az: {
        'User not found': 'Bu email ilə istifadəçi tapılmadı',
        'Email not confirmed': 'Email təsdiqlənməyib',
        'rate limit': 'Çox sayda cəhd. Bir az gözləyin',
      },
      ru: {
        'User not found': 'Пользователь с таким email не найден',
        'Email not confirmed': 'Email не подтверждён',
        'rate limit': 'Слишком много попыток. Подождите немного',
      },
      en: {
        'User not found': 'No user found with this email',
        'Email not confirmed': 'Email not confirmed',
        'rate limit': 'Too many attempts. Please wait a moment',
      },
    }
    const langErrors = errors[lang]
    for (const [key, val] of Object.entries(langErrors)) {
      if (msg.includes(key)) return val
    }
    return msg
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://horecahub.az/reset-password',
    })
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Helmet><title>{t('password.forgotMeta')} — HorecaHub</title></Helmet>
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-navy mb-2">{t('password.forgotTitle')}</h1>
        {sent ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-semibold mb-2">{t('password.sentTitle')}</p>
            <p className="text-gray-500 text-sm mb-6">{t('password.sentDesc')}</p>
            <Link to="/login" className="text-blue-600 hover:underline text-sm">{t('password.backToLogin')}</Link>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">{t('password.forgotDesc')}</p>
            {error && <p className="text-red-500 text-sm mb-4">{translateError(error)}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder={t('password.emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? t('password.sending') : t('password.send')}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-blue-600 hover:underline">{t('password.backToLogin')}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { supabase } from '../supabaseClient'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  function translateError(msg) {
    if (!msg) return msg
    const lang = i18n.language?.startsWith('ru') ? 'ru' : i18n.language?.startsWith('en') ? 'en' : 'az'
    const errors = {
      az: {
        'different from the old password': 'Yeni şifrə köhnə şifrədən fərqli olmalıdır',
        'Password should be at least': 'Şifrə ən az 6 simvol olmalıdır',
        'Invalid': 'Keçərsiz link. Yenidən şifrə sıfırlama tələb edin',
        'expired': 'Linkın müddəti bitib. Yenidən şifrə sıfırlama tələb edin',
        'Token has expired': 'Linkın müddəti bitib. Yenidən cəhd edin',
      },
      ru: {
        'different from the old password': 'Новый пароль должен отличаться от старого',
        'Password should be at least': 'Пароль должен содержать не менее 6 символов',
        'Invalid': 'Недействительная ссылка. Запросите сброс пароля заново',
        'expired': 'Срок действия ссылки истёк. Запросите сброс пароля заново',
        'Token has expired': 'Срок действия ссылки истёк. Попробуйте снова',
      },
      en: {
        'different from the old password': 'New password must be different from the old password',
        'Password should be at least': 'Password must be at least 6 characters',
        'Invalid': 'Invalid link. Please request a new password reset',
        'expired': 'Link has expired. Please request a new password reset',
        'Token has expired': 'Link has expired. Please try again',
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
    if (password !== confirm) { setError(t('password.mismatch')); return }
    if (password.length < 6) { setError(t('password.tooShort')); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Helmet><title>{t('password.resetMeta')} — HorecaHub</title></Helmet>
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-navy mb-6">{t('password.resetTitle')}</h1>
        {success ? (
          <p className="text-green-600 font-semibold text-center">{t('password.updatedRedirect')}</p>
        ) : (
          <>
            {error && <p className="text-red-500 text-sm mb-4">{translateError(error)}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder={t('password.newPlaceholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="password"
                placeholder={t('password.confirmPlaceholder')}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? t('password.updating') : t('password.update')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { notifyTelegram } from '../lib/notify'
import { CITIES } from '../data/mockData'
import { translateAuthError } from '../lib/authErrors'
import PhoneInput from '../components/PhoneInput'
import Logo from '../components/Logo'
import { useTranslation } from 'react-i18next'
import { SUPPLIER_CATEGORIES } from '../data/mockData'

const strip = v => (v || '').replace(/<[^>]*>/g, '').trim()

const EMPTY = {
  email: '', password: '', confirmPassword: '',
  fullName: '', phone: '', phone2: '', city: '',
  accountType: 'individual', companyName: '',
  supplierCategories: [],
}

export default function Register() {
  const { t } = useTranslation()
  const [form, setForm]         = useState(EMPTY)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirmed, setConfirmed]       = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const navigate = useNavigate()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleSupplierCategory(cat) {
    setForm(f => ({
      ...f,
      supplierCategories: f.supplierCategories.includes(cat)
        ? f.supplierCategories.filter(c => c !== cat)
        : [...f.supplierCategories, cat],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Field-level validation
    const fe = {}
    if (strip(form.fullName).length < 2)
      fe.fullName = t('auth.errName')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      fe.email = t('auth.errEmail')
    if (form.password.length < 6)
      fe.password = t('auth.errPassword')
    if (form.password !== form.confirmPassword)
      fe.confirmPassword = t('auth.errConfirm')
    if (!form.phone || !/^\+994\d{10}$/.test(form.phone))
      fe.phone = t('auth.errPhone')
    if (form.phone2 && !/^\+994\d{10}$/.test(form.phone2))
      fe.phone2 = t('auth.errPhone2')
    if (!form.city)
      fe.city = t('auth.errCity')
    if (form.accountType === 'supplier' && !strip(form.companyName))
      fe.companyName = t('auth.errCompany')
    if (form.accountType === 'supplier' && form.supplierCategories.length === 0)
      fe.supplierCategories = t('auth.errCategories')
    if (!termsAccepted)
      fe.terms = t('auth.errTerms')
    setFieldErrors(fe)
    if (Object.keys(fe).length > 0) return

    setLoading(true)
    setError('')
    setFieldErrors({})

    const { data: signUpData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name:            strip(form.fullName),
          phone:                form.phone,
          city:                 form.city,
          account_type:         form.accountType,
          company_name:         form.accountType === 'supplier' ? strip(form.companyName) : null,
          phone2:               form.accountType === 'supplier' && form.phone2 ? form.phone2 : null,
          supplier_categories:  form.accountType === 'supplier' ? form.supplierCategories : [],
        },
      },
    })

    if (authErr) {
      setError(t(translateAuthError(authErr.message)))
      setLoading(false)
      return
    }

    await notifyTelegram({
      title: '🆕 Yeni qeydiyyat',
      category: form.accountType === 'supplier' ? 'Təchizatçı' : 'Fərdi',
      city: form.city || '',
      user_name: form.fullName || form.email,
    })

    if (!signUpData.session) {
      setConfirmed(true)
    } else {
      navigate('/', { replace: true })
    }
  }

  const isSupplier = form.accountType === 'supplier'

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <Helmet><title>{t('auth.confirmEmail')} — HorecaHub</title></Helmet>
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">✉️</div>
          <h1 className="text-2xl font-bold text-navy mb-3">{t('auth.confirmEmail')}</h1>
          <p className="text-gray-600 mb-3 leading-relaxed">
            {t('auth.confirmEmailDesc', { email: form.email })}
          </p>
          {isSupplier && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 leading-relaxed">
              {t('auth.supplierPendingNotice')}
            </p>
          )}
          <p className="text-sm text-gray-400 mb-8">{t('auth.checkSpam')}</p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <Helmet><title>{t('auth.registerBtn')} — HorecaHub</title></Helmet>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/"><Logo height={34} /></Link>
          <h1 className="text-2xl font-bold text-navy mt-6 mb-1">{t('auth.registerTitle')}</h1>
          <p className="text-sm text-gray-500">{t('auth.registerSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account type */}
            <div>
              <label className="block text-sm font-medium text-navy mb-2">{t('auth.accountType')}</label>
              <div className="flex gap-3">
                {[{ value: 'individual', label: t('auth.individual') }, { value: 'supplier', label: t('auth.supplier') }].map(({ value, label }) => (
                  <label key={value} className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                    form.accountType === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}>
                    <input type="radio" name="accountType" value={value} checked={form.accountType === value}
                      onChange={() => setForm(f => ({ ...f, accountType: value, supplierCategories: [] }))} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
              {isSupplier && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 leading-snug">
                  {t('auth.supplierModerationHint')}
                </p>
              )}
            </div>

            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('auth.fullName')}</label>
              <input type="text" value={form.fullName}
                onChange={e => { set('fullName', e.target.value); setFieldErrors(fe => ({ ...fe, fullName: '' })) }}
                placeholder={t('auth.fullNamePlaceholder')}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.fullName ? 'border-red-400' : 'border-gray-200'}`} />
              {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
            </div>

            {/* Company name (supplier) */}
            {isSupplier && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">{t('auth.companyName')}</label>
                <input type="text" value={form.companyName}
                  onChange={e => { set('companyName', e.target.value); setFieldErrors(fe => ({ ...fe, companyName: '' })) }}
                  placeholder={t('auth.companyPlaceholder')}
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.companyName ? 'border-red-400' : 'border-gray-200'}`} />
                {fieldErrors.companyName && <p className="text-red-500 text-xs mt-1">{fieldErrors.companyName}</p>}
              </div>
            )}

            {/* Phone (required) */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('auth.phone')}</label>
              <PhoneInput value={form.phone} onChange={v => { set('phone', v); setFieldErrors(fe => ({ ...fe, phone: '' })) }} required />
              {fieldErrors.phone
                ? <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                : <p className="text-xs text-gray-400 mt-1">{t('auth.phoneHint')}</p>
              }
            </div>

            {/* Phone 2 (supplier, optional) */}
            {isSupplier && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  {t('auth.phone2')}
                </label>
                <PhoneInput value={form.phone2} onChange={v => { set('phone2', v); setFieldErrors(fe => ({ ...fe, phone2: '' })) }} />
                {fieldErrors.phone2 && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone2}</p>}
              </div>
            )}

            {/* Supplier categories */}
            {isSupplier && (
              <div>
                <label className="block text-sm font-medium text-navy mb-2">
                  {t('auth.supplierCategories')}
                </label>
                <div className="grid grid-cols-2 gap-2 p-4 border border-gray-200 rounded-xl bg-gray-50">
                  {SUPPLIER_CATEGORIES.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.supplierCategories.includes(cat)}
                        onChange={() => { toggleSupplierCategory(cat); setFieldErrors(fe => ({ ...fe, supplierCategories: '' })) }}
                        className="accent-blue-600 rounded w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 leading-tight">{cat}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.supplierCategories && (
                  <p className="text-xs text-red-600 mt-2">{fieldErrors.supplierCategories}</p>
                )}
              </div>
            )}

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('auth.city')}</label>
              <select value={form.city}
                onChange={e => { set('city', e.target.value); setFieldErrors(fe => ({ ...fe, city: '' })) }}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white ${fieldErrors.city ? 'border-red-400' : 'border-gray-200'}`}>
                <option value="">{t('auth.selectCity')}</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {fieldErrors.city && <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('auth.email')} *</label>
              <input type="email" autoComplete="email" value={form.email}
                onChange={e => { set('email', e.target.value); setFieldErrors(fe => ({ ...fe, email: '' })) }}
                placeholder={t('auth.emailPlaceholder')}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'}`} />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">{t('auth.password')} *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password}
                    onChange={e => { set('password', e.target.value); setFieldErrors(fe => ({ ...fe, password: '', confirmPassword: '' })) }}
                    placeholder={t('auth.passwordPlaceholder')}
                    className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'}`} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword}
                    onChange={e => { set('confirmPassword', e.target.value); setFieldErrors(fe => ({ ...fe, confirmPassword: '' })) }}
                    placeholder={t('auth.confirmPlaceholder')}
                    className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
              </div>
            </div>

            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 accent-blue-600 w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-gray-600 leading-snug">
                  <a href="/terms" target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline font-medium">{t('auth.termsLink')}</a>
                  {' '}{t('auth.and')}{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer"
                    className="text-blue-600 hover:underline font-medium">{t('auth.privacyLink')}</a>
                  {' '}{t('auth.termsAccept')}
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="text-red-500 text-xs mt-1.5">{fieldErrors.terms}</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors mt-1">
              {loading ? t('auth.registering') : t('auth.registerBtn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">{t('auth.loginLink')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

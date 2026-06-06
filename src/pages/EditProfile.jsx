import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Camera, ChevronLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import PhoneInput from '../components/PhoneInput'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CITIES } from '../data/mockData'
import { useTranslation } from 'react-i18next'

export default function EditProfile() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const ACCOUNT_TYPE_LABEL = { individual: t('editProfile.individual'), supplier: t('editProfile.supplier') }

  const [profile, setProfile]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Form fields
  const [fullName, setFullName]       = useState('')
  const [phone, setPhone]             = useState('')
  const [city, setCity]               = useState('')
  const [description, setDescription] = useState('')
  const [companyName, setCompanyName] = useState('')

  // Avatar
  const [avatarFile, setAvatarFile]   = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { state: { from: '/edit-profile' } })
  }, [user, authLoading, navigate])

  // Fetch current profile
  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchErr || !data) {
        setError('Profil yüklənərkən xəta baş verdi.')
        setLoading(false)
        return
      }

      setProfile(data)
      setFullName(data.full_name || '')
      setPhone(data.phone || '')
      setCity(data.city || '')
      setDescription(data.description || '')
      setCompanyName(data.company_name || '')
      setAvatarPreview(data.logo_url || '')
      setLoading(false)
    }
    load()
  }, [user])

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    const fe = {}
    if (fullName.trim().length < 2) fe.fullName = t('editProfile.errName')
    if (!phone || !/^\+994\d{10}$/.test(phone)) fe.phone = t('editProfile.errPhone')
    if (!city) fe.city = t('editProfile.errCity')
    setFieldErrors(fe)
    if (Object.keys(fe).length > 0) return

    setSaving(true)
    setError('')
    setSuccess(false)

    let logoUrl = profile?.logo_url || null

    // Upload avatar if a new file selected
    if (avatarFile) {
      const ext      = avatarFile.name.split('.').pop()
      const fileName = `avatars/${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('listings')
        .upload(fileName, avatarFile, { upsert: true, contentType: avatarFile.type })

      if (uploadErr) {
        setError(`Şəkil yüklənərkən xəta: ${uploadErr.message}`)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('listings').getPublicUrl(fileName)
      logoUrl = urlData.publicUrl
    }

    const updates = {
      full_name:   fullName.trim(),
      phone:       phone || null,
      city:        city || null,
      description: description.trim() || null,
      logo_url:    logoUrl,
    }
    if (profile?.account_type === 'supplier') {
      updates.company_name = companyName.trim() || null
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (updateErr) {
      setError(updateErr.message)
    } else {
      setSuccess(true)
      setProfile(prev => ({ ...prev, ...updates }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setSaving(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const initial = (profile.full_name || profile.company_name || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        to={`/profile/${user.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-8 transition-colors"
      >
        <ChevronLeft size={16} /> {t('editProfile.back')}
      </Link>

      <h1 className="text-2xl font-bold text-navy mb-8">{t('editProfile.title')}</h1>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 mb-6">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <span>{t('editProfile.success')}</span>
          <Link to={`/profile/${user.id}`} className="ml-auto font-semibold underline hover:no-underline">
            {t('editProfile.viewProfile')}
          </Link>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar upload */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-navy mb-5">{t('editProfile.photoSection')}</h2>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-3xl overflow-hidden border-2 border-gray-200">
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  : initial
                }
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
                title={t('editProfile.uploadTooltip')}
              >
                <Camera size={14} className="text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-navy mb-1">{t('editProfile.changePhoto')}</p>
              <p className="text-xs text-gray-500 mb-3">{t('editProfile.photoHint')}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-200 text-sm font-medium text-navy rounded-xl hover:bg-gray-50 transition-colors"
              >
                {t('editProfile.selectPhoto')}
              </button>
            </div>
          </div>
        </div>

        {/* Main fields */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-navy">{t('editProfile.personalInfo')}</h2>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">{t('editProfile.fullName')}</label>
            <input
              type="text" value={fullName}
              onChange={e => { setFullName(e.target.value); setFieldErrors(fe => ({ ...fe, fullName: '' })) }}
              placeholder={t('auth.fullNamePlaceholder')}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.fullName ? 'border-red-400' : 'border-gray-200'}`}
            />
            {fieldErrors.fullName && <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>}
          </div>

          {profile.account_type === 'supplier' && (
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('editProfile.companyName')}</label>
              <input
                type="text" value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder={t('auth.companyPlaceholder')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-navy mb-1.5">{t('editProfile.phone')}</label>
              <PhoneInput value={phone} onChange={v => { setPhone(v); setFieldErrors(fe => ({ ...fe, phone: '' })) }} />
              {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-navy mb-1.5">{t('editProfile.city')}</label>
              <select
                value={city} onChange={e => { setCity(e.target.value); setFieldErrors(fe => ({ ...fe, city: '' })) }}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white ${fieldErrors.city ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">{t('editProfile.selectCity')}</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">{t('editProfile.about')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('editProfile.aboutPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Read-only info */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-navy mb-1">{t('editProfile.readonlySection')}</h2>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-500">{t('editProfile.emailLabel')}</span>
            <span className="text-sm font-medium text-navy">{profile.email || user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-500">{t('editProfile.accountTypeLabel')}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              profile.account_type === 'supplier'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              {ACCOUNT_TYPE_LABEL[profile.account_type] || profile.account_type}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link
            to={`/profile/${user.id}`}
            className="px-6 py-3 border border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            {t('editProfile.cancel')}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm flex items-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? t('editProfile.saving') : t('editProfile.save')}
          </button>
        </div>
      </form>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Camera, ChevronLeft, ChevronDown, CheckCircle2, AlertCircle, Loader2, Trash2, Eye, EyeOff, Clock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

export default function EditProfile() {
  const { t } = useTranslation()
  const { user, loading: authLoading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const ACCOUNT_TYPE_LABEL = { individual: t('editProfile.individual'), supplier: t('editProfile.supplier') }

  const [profile, setProfile]               = useState(null)
  const [loading, setLoading]               = useState(true)
  const [saving, setSaving]                 = useState(false)
  const [success, setSuccess]               = useState(false)
  const [error, setError]                   = useState('')
  const [fieldErrors, setFieldErrors]       = useState({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const [reapplying, setReapplying]         = useState(false)

  // Editable fields
  const [fullName, setFullName]       = useState('')
  const [description, setDescription] = useState('')
  const [companyName, setCompanyName] = useState('')

  // Password section visibility
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  // Avatar
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  // Password change
  const [newPassword, setNewPassword]           = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPass, setShowNewPass]           = useState(false)
  const [showConfirmPass, setShowConfirmPass]   = useState(false)
  const [passwordSaving, setPasswordSaving]     = useState(false)
  const [passwordSuccess, setPasswordSuccess]   = useState(false)
  const [passwordError, setPasswordError]       = useState('')

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { state: { from: '/edit-profile' } })
  }, [user, authLoading, navigate])

  // Fetch current profile and pre-fill form
  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      // Own full profile via SECURITY DEFINER RPC (see AuthContext) —
      // base table no longer exposes a blanket select('*') to clients.
      const { data, error: fetchErr } = await supabase
        .rpc('get_my_profile')
        .maybeSingle()

      if (fetchErr || !data) {
        setError(t('editProfile.loadError'))
        setLoading(false)
        return
      }

      setProfile(data)
      setFullName(data.full_name || '')
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
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_MB = 5
    if (!ALLOWED_TYPES.includes(file.type)) { alert(t('editProfile.avatarTypeError')); return }
    if (file.size > MAX_MB * 1024 * 1024) { alert(t('editProfile.avatarSizeError', { mb: MAX_MB })); return }
    if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const { error: rpcErr } = await supabase.rpc('delete_user')
    if (rpcErr) {
      setError(t('editProfile.deleteError'))
      setDeleting(false)
      setShowDeleteModal(false)
      return
    }
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  async function handleSave(e) {
    e.preventDefault()
    const fe = {}
    if (fullName.trim().length < 2) fe.fullName = t('editProfile.errName')
    setFieldErrors(fe)
    if (Object.keys(fe).length > 0) return

    setSaving(true)
    setError('')
    setSuccess(false)

    let logoUrl = profile?.logo_url || null

    if (avatarFile) {
      const ext      = avatarFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true, contentType: avatarFile.type })

      if (uploadErr) {
        setError(`${t('editProfile.uploadError')} ${uploadErr.message}`)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      logoUrl = urlData.publicUrl
    }

    const updates = {
      full_name:   fullName.trim(),
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
      await refreshProfile()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setSaving(false)
  }

  // Re-submit a rejected application. The DB trigger allows the owner to
  // move only rejected/none → pending; account_type stays admin-granted.
  async function handleReapply() {
    setReapplying(true)
    // .select() so a trigger- or RLS-filtered write cannot read as success:
    // the row comes back with whatever the DB actually stored.
    const { data: rows, error: err } = await supabase
      .from('profiles')
      .update({ supplier_status: 'pending' })
      .eq('id', user.id)
      .select('supplier_status, supplier_reject_reason')
    if (err) {
      setError(err.message)
    } else if (!rows || rows.length === 0 || rows[0].supplier_status !== 'pending') {
      setError(t('editProfile.supplierApplyFailed'))
    } else {
      setProfile(prev => ({
        ...prev,
        supplier_status: rows[0].supplier_status,
        supplier_reject_reason: rows[0].supplier_reject_reason,
      }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setReapplying(false)
  }

  async function handlePasswordChange() {
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword.length < 6) { setPasswordError(t('auth.errPassword')); return }
    if (newPassword !== confirmNewPassword) { setPasswordError(t('auth.errConfirm')); return }

    setPasswordSaving(true)
    const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
    if (pwErr) {
      setPasswordError(pwErr.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmNewPassword('')
    }
    setPasswordSaving(false)
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

        {/* Main editable fields */}
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
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-1">
          <h2 className="text-sm font-semibold text-navy mb-2">{t('editProfile.readonlySection')}</h2>
          <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
            <span className="text-sm text-gray-500">{t('editProfile.emailLabel')}</span>
            <span className="text-sm font-medium text-navy">{profile.email || user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
            <span className="text-sm text-gray-500">{t('editProfile.phone')}</span>
            <span className="text-sm font-medium text-navy">{profile.phone || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2.5 border-b border-gray-200">
            <span className="text-sm text-gray-500">{t('editProfile.city')}</span>
            <span className="text-sm font-medium text-navy">{profile.city || '—'}</span>
          </div>
          <div className="flex justify-between items-center py-2.5">
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

        {/* Supplier application status */}
        {/* 'none' needs its own entry point: the DB trigger allows the owner to
            move none/rejected → pending, but the UI only ever offered the
            rejected half. Without this an individual account can never become a
            supplier, and anyone whose signup application was dropped is stuck. */}
        {profile.account_type !== 'supplier' &&
         (!profile.supplier_status || profile.supplier_status === 'none') && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-3">
            <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">{t('editProfile.supplierApplyTitle')}</p>
              <p className="text-sm text-blue-800 mt-1 leading-relaxed">{t('editProfile.supplierApplyDesc')}</p>
              <button
                type="button"
                onClick={handleReapply}
                disabled={reapplying}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
              >
                {reapplying && <Loader2 size={14} className="animate-spin" />}
                {t('editProfile.supplierApply')}
              </button>
            </div>
          </div>
        )}
        {profile.supplier_status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
            <Clock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">{t('editProfile.supplierPendingTitle')}</p>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">{t('editProfile.supplierPendingDesc')}</p>
            </div>
          </div>
        )}
        {profile.supplier_status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex gap-3">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">{t('editProfile.supplierRejectedTitle')}</p>
              {profile.supplier_reject_reason && (
                <p className="text-sm text-red-800 mt-1 leading-relaxed">
                  {t('editProfile.supplierRejectedReason')} {profile.supplier_reject_reason}
                </p>
              )}
              <button
                type="button"
                onClick={handleReapply}
                disabled={reapplying}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60"
              >
                {reapplying ? t('editProfile.saving') : t('editProfile.supplierReapply')}
              </button>
            </div>
          </div>
        )}

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

      {/* Password change */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6">
        <button
          type="button"
          onClick={() => { setShowPasswordSection(v => !v); setPasswordError(''); setPasswordSuccess(false) }}
          className="flex items-center justify-between w-full text-sm font-semibold text-navy"
        >
          {t('editProfile.changePassword')}
          <ChevronDown size={16} className={`transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} />
        </button>

        {showPasswordSection && (
          <div className="space-y-4 mt-4 pt-4 border-t border-gray-100">
            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                {t('editProfile.passwordUpdated')}
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0" />
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('editProfile.newPassword')}</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowNewPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showNewPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('editProfile.confirmNewPassword')}</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={e => { setConfirmNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowConfirmPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirmPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={passwordSaving || !newPassword}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
              >
                {passwordSaving && <Loader2 size={14} className="animate-spin" />}
                {passwordSaving ? t('editProfile.updatingPassword') : t('editProfile.updatePassword')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-8 pt-6 border-t border-red-100">
        <h3 className="text-sm font-semibold text-red-600 mb-3">{t('editProfile.dangerZone')}</h3>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors text-sm"
        >
          <Trash2 size={15} />
          {t('editProfile.deleteAccount')}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-navy text-center mb-2">
              {t('editProfile.deleteTitle')}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              {t('editProfile.deleteDesc')}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
              >
                {t('editProfile.deleteCancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? t('editProfile.deleting') : t('editProfile.deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

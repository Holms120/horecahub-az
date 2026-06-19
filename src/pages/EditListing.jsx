import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft, Check, Upload, X, AlertCircle, ImageOff,
  CheckCircle2, Loader2,
  ChefHat, Coffee, Thermometer, UtensilsCrossed,
  LayoutGrid, Wine, Users, Truck, ShoppingBasket,
  Shirt, Wrench, Printer, HardHat, Scale
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, CITIES, SUBCATEGORIES } from '../data/mockData'
import { useTranslation } from 'react-i18next'

const ICON_MAP = { ChefHat, Coffee, Thermometer, UtensilsCrossed, LayoutGrid, Wine, Users, Truck, ShoppingBasket, Shirt, Wrench, Printer, HardHat, Scale }

const NO_CONDITION_CATEGORIES = [
  'food_ingredients', 'hygiene', 'alcohol', 'packaging', 'textile',
  'print_ads', 'legal_finance', 'consulting', 'software', 'training', 'staff',
]

const MAX_FILES   = 5
const MAX_MB      = 5
const ALLOWED     = ['jpg', 'jpeg', 'png', 'webp']
const strip       = v => (v || '').replace(/<[^>]*>/g, '').trim()

const EMPTY_FORM = {
  category: '', subcategory: '', otherDescription: '', title: '', description: '',
  condition: 'Yeni', city: '', price: '', paymentType: 'cash',
}

export default function EditListing() {
  const { t }                       = useTranslation()
  const { id }                      = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate                    = useNavigate()

  const PAYMENT_OPTS = [
    { value: 'cash',   label: t('addListing.cash') },
    { value: 'credit', label: t('addListing.credit') },
    { value: 'order',  label: t('addListing.order') },
  ]

  const [form, setForm]             = useState(EMPTY_FORM)
  const [existingImages, setExistingImages] = useState([])
  const [newFiles, setNewFiles]     = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [imageError, setImageError] = useState('')

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]         = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved]           = useState(false)
  const [saveError, setSaveError]   = useState('')

  const totalImages = existingImages.length + newFiles.length

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    if (NO_CONDITION_CATEGORIES.includes(form.category)) {
      setForm(f => ({ ...f, condition: 'Yeni' }))
    }
  }, [form.category])

  // Fetch listing and verify ownership
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { state: { from: `/listings/${id}/edit` } }); return }

    async function load() {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) { navigate('/listings'); return }
      if (data.user_id !== user.id) { navigate(`/listings/${id}`); return }

      setForm({
        category:    data.category    || '',
        subcategory:      data.subcategory      || '',
        otherDescription: data.other_description || '',
        title:       data.title       || '',
        description: data.description || '',
        condition:   data.condition === 'new' ? 'Yeni' : 'İşlənmiş',
        city:        data.city        || '',
        price:       data.price != null ? String(data.price) : '',
        paymentType: data.payment_type || 'cash',
      })
      setExistingImages(Array.isArray(data.images) ? data.images : [])
      setPageLoading(false)
    }
    load()
  }, [user, authLoading, id, navigate])

  function removeExisting(url) {
    setExistingImages(imgs => imgs.filter(u => u !== url))
  }

  function handleFileChange(e) {
    const slots    = MAX_FILES - totalImages
    if (slots <= 0) return
    const incoming = Array.from(e.target.files)
    let firstError = ''
    const valid    = []

    for (const file of incoming) {
      if (valid.length >= slots) break
      const ext = file.name.split('.').pop().toLowerCase()
      if (!ALLOWED.includes(ext)) {
        firstError = t('addListing.errFormat')
        continue
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        firstError = t('addListing.errSize')
        continue
      }
      valid.push(file)
    }

    setImageError(firstError)
    if (!valid.length) return

    const combined = [...newFiles, ...valid]
    newPreviews.forEach(u => URL.revokeObjectURL(u))
    setNewFiles(combined)
    setNewPreviews(combined.map(f => URL.createObjectURL(f)))
    e.target.value = ''
  }

  function removeNew(i) {
    URL.revokeObjectURL(newPreviews[i])
    setNewFiles(f => f.filter((_, idx) => idx !== i))
    setNewPreviews(p => p.filter((_, idx) => idx !== i))
    if (imageError) setImageError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    const fe = {}
    if (!form.category)                                                       fe.category       = t('addListing.selectCategory')
    if (SUBCATEGORIES[form.category]?.length > 0 && !form.subcategory)       fe.subcategory    = t('addListing.subcategory').replace(' *','')
    if (strip(form.title).length < 5)                                         fe.title          = t('addListing.errTitle')
    if (!form.city)                                                            fe.city           = t('addListing.errCity')
    if (Number(form.price) < 1)                                               fe.price          = form.category === 'staff' ? t('addListing.errSalary') : t('addListing.errPrice')
    setFieldErrors(fe)
    if (Object.keys(fe).length > 0) {
      setSaveError(Object.values(fe)[0])
      return
    }

    setSaving(true)
    setSaveError('')
    setFieldErrors({})

    // Upload new files
    const newUrls = []
    for (const file of newFiles) {
      const ext      = file.name.split('.').pop().toLowerCase()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('listings')
        .upload(fileName, file, { contentType: file.type })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('listings').getPublicUrl(fileName)
        newUrls.push(urlData.publicUrl)
      }
    }

    const { error } = await supabase
      .from('listings')
      .update({
        title:        strip(form.title),
        description:  strip(form.description),
        category:          form.category,
        subcategory:       form.subcategory || null,
        other_description: form.subcategory?.endsWith('_other') && form.otherDescription ? form.otherDescription.trim() : null,
        condition:    form.condition === 'Yeni' ? 'new' : 'used',
        city:         form.city,
        price:        Number(form.price),
        payment_type: form.paymentType,
        images:       [...existingImages, ...newUrls],
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setSaveError(error.message)
      setSaving(false)
    } else {
      setSaved(true)
      setTimeout(() => navigate(`/listings/${id}`), 1800)
    }
  }

  // ── Loading states ────────────────────────────────────────────
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (saved) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-3">Elan yeniləndi!</h2>
        <p className="text-gray-500">Elan səhifəsinə yönləndirilirsiniz...</p>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to={`/listings/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-8 transition-colors"
      >
        <ChevronLeft size={16} /> {t('listingDetail.back')}
      </Link>

      <h1 className="text-2xl font-bold text-navy mb-8">Elanı redaktə et</h1>

      {saveError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle size={16} className="flex-shrink-0" />
          {saveError}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Kateqoriya ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-navy mb-4">{t('filter.category')} *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => {
              const Icon = ICON_MAP[cat.icon]
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.id, subcategory: '' }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    form.category === cat.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-300 text-gray-600'
                  }`}
                >
                  {Icon && <Icon size={20} />}
                  <span className="text-xs font-medium text-center leading-tight">{t(cat.key) || cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* Subcategory selector */}
          {form.category && SUBCATEGORIES[form.category]?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-navy mb-3">{t('addListing.subcategory')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {SUBCATEGORIES[form.category].map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      subcategory: sub.id,
                      otherDescription: '',
                      ...(['staff', 'consulting', 'software', 'training'].includes(f.category)
                        ? { title: SUBCATEGORIES[f.category]?.find(s => s.id === sub.id)?.label || '' }
                        : {}),
                    }))}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${
                      form.subcategory === sub.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 hover:border-blue-300 text-gray-600'
                    }`}
                  >
                    {t('subcat.' + sub.id) || sub.label}
                  </button>
                ))}
              </div>
              {form.subcategory?.endsWith('_other') && (
                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {t('addListing.otherDesc')}
                  </label>
                  <input
                    type="text"
                    value={form.otherDescription}
                    onChange={e => set('otherDescription', e.target.value)}
                    placeholder={t('addListing.otherPlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Detallar ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-navy">{t('addListing.listingDetails')}</h2>

          {!['staff', 'consulting', 'software', 'training'].includes(form.category) && (
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.titleLabel')}</label>
              <input
                type="text" value={form.title} maxLength={80}
                onChange={e => { set('title', e.target.value); setFieldErrors(fe => ({ ...fe, title: '' })) }}
                placeholder={t('addListing.titlePlaceholderDefault')}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.title ? 'border-red-400' : 'border-gray-200'}`}
              />
              <div className="flex justify-between mt-1">
                {fieldErrors.title ? <p className="text-red-500 text-xs">{fieldErrors.title}</p> : <span />}
                <p className="text-xs text-gray-400">{form.title.length}/80</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.description')}</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder={t('addListing.descPlaceholder')}
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {!NO_CONDITION_CATEGORIES.includes(form.category) && (
          <div>
            <label className="block text-sm font-medium text-navy mb-2">{t('addListing.condition')}</label>
            <div className="flex gap-3">
              {['Yeni', 'İşlənmiş'].map(c => (
                <label
                  key={c}
                  className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
                    form.condition === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  <input type="radio" name="condition" value={c} checked={form.condition === c}
                    onChange={() => set('condition', c)} className="sr-only" />
                  {c === 'Yeni' ? t('addListing.new') : t('addListing.used')}
                </label>
              ))}
            </div>
          </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.city')}</label>
            <select
              value={form.city} onChange={e => { set('city', e.target.value); setFieldErrors(fe => ({ ...fe, city: '' })) }}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white ${fieldErrors.city ? 'border-red-400' : 'border-gray-200'}`}
            >
              <option value="">{t('addListing.selectCity')}</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
        </div>

        {/* ── Şəkillər ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy">{t('addListing.photosTitle')}</h2>
            <span className="text-sm text-gray-500 font-medium">{totalImages}/{MAX_FILES}</span>
          </div>

          {imageError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
              <AlertCircle size={14} className="flex-shrink-0" />
              {imageError}
            </div>
          )}

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Mövcud şəkillər</p>
              <div className="grid grid-cols-4 gap-2">
                {existingImages.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && existingImages.length > 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        {t('addListing.mainPhoto')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExisting(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                    >
                      <X size={11} className="text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file previews */}
          {newPreviews.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Yeni şəkillər</p>
              <div className="grid grid-cols-4 gap-2">
                {newPreviews.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-blue-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNew(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                    >
                      <X size={11} className="text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload area */}
          {totalImages < MAX_FILES ? (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload size={24} className="text-gray-400 mb-1.5" />
              <span className="text-sm font-medium text-gray-600">{t('addListing.selectPhotos')}</span>
              <span className="text-xs text-gray-400 mt-0.5">
                {t('addListing.morePhotos', { count: MAX_FILES - totalImages })}
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
              <Check size={14} className="text-green-600" />
              Maksimum şəkil sayına çatılıb ({MAX_FILES}/{MAX_FILES})
            </div>
          )}

          {totalImages === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700 mt-3">
              <ImageOff size={14} />
              {t('addListing.noPhotoWarning')}
            </div>
          )}
        </div>

        {/* ── Qiymət ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-navy">{t('addListing.reviewPrice')}</h2>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.priceLabel')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₼</span>
              <input
                type="number"
                min="1"
                value={form.price}
                onChange={e => { set('price', e.target.value); setFieldErrors(fe => ({ ...fe, price: '' })) }}
                placeholder="0"
                className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.price ? 'border-red-400' : 'border-gray-200'}`}
              />
            </div>
            {fieldErrors.price && <p className="text-red-500 text-xs mt-1">{fieldErrors.price}</p>}
            {!fieldErrors.price && form.price !== '' && Number(form.price) < 1 && (
              <p className="text-xs text-red-600 mt-1">Qiymət ən azı ₼1 olmalıdır</p>
            )}
          </div>

          {!['staff', 'consulting', 'software', 'training'].includes(form.category) && (
            <div>
              <label className="block text-sm font-medium text-navy mb-3">{t('addListing.paymentType')}</label>
              <div className="flex flex-col gap-2">
                {PAYMENT_OPTS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.paymentType === value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value={value}
                      checked={form.paymentType === value}
                      onChange={() => set('paymentType', value)}
                      className="accent-blue-600"
                    />
                    <span className={`text-sm font-medium ${form.paymentType === value ? 'text-blue-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 justify-end">
          <Link
            to={`/listings/${id}`}
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

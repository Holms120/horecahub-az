import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Upload, AlertCircle } from 'lucide-react'
import {
  ChefHat, Coffee, Thermometer, UtensilsCrossed,
  LayoutGrid, Wine, Users, Truck
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, CITIES } from '../data/mockData'

const ICON_MAP = { ChefHat, Coffee, Thermometer, UtensilsCrossed, LayoutGrid, Wine, Users, Truck }
const STEPS = ['Kateqoriya', 'Detallar', 'Şəkillər', 'Qiymət', 'Nəzərdən keçir']
const EMPTY_FORM = {
  category: '', title: '', description: '',
  condition: 'Yeni', city: '',
  price: '', negotiable: false,
}

export default function AddListing() {
  const [step, setStep]           = useState(0)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function canProceed() {
    if (step === 0) return !!form.category
    if (step === 1) return form.title.trim().length >= 5 && !!form.city
    if (step === 3) return form.negotiable || Number(form.price) > 0
    return true
  }

  async function handleSubmit() {
    if (!user) {
      navigate('/login', { state: { from: '/sell' } })
      return
    }

    setSubmitting(true)
    setSubmitError('')

    const { error } = await supabase.from('listings').insert({
      user_id:     user.id,
      title:       form.title.trim(),
      description: form.description.trim(),
      price:       form.negotiable ? 0 : Number(form.price),
      category:    form.category,
      condition:   form.condition === 'Yeni' ? 'new' : 'used',
      city:        form.city,
      images:      [],
      status:      'active',
    })

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={36} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-3">Elan yerləşdirildi!</h2>
        <p className="text-gray-500 mb-8">Elanınız aktiv oldu.</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/listings')}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
            Elanlara bax
          </button>
          <button onClick={() => { setForm(EMPTY_FORM); setStep(0); setSubmitted(false) }}
            className="w-full py-3 border border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50">
            Yeni elan yerləşdir
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy mb-8">Elan yerləşdir</h1>

      {/* Auth warning */}
      {!user && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 text-sm text-yellow-800">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Elanı yerləşdirmək üçün daxil olmalısınız.{' '}
            <button onClick={() => navigate('/login', { state: { from: '/sell' } })}
              className="font-semibold underline hover:no-underline">
              Daxil olun
            </button>
          </span>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-1 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step  ? 'bg-blue-600 text-white' :
                i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs mt-1 hidden sm:block whitespace-nowrap ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-3 transition-colors ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">

        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-navy mb-6">Kateqoriyanı seçin</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => {
                const Icon = ICON_MAP[cat.icon]
                return (
                  <button key={cat.id} onClick={() => set('category', cat.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      form.category === cat.id
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-blue-300 text-gray-600'
                    }`}>
                    {Icon && <Icon size={22} />}
                    <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-navy mb-2">Elan detalları</h2>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Başlıq *</label>
              <input type="text" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="məs. La Marzocco 2-qrup espresso maşını" maxLength={80}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/80</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Təsvir</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Avadanlığın vəziyyəti, xüsusiyyətləri, satış səbəbi..." rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Vəziyyət *</label>
              <div className="flex gap-3">
                {['Yeni', 'İşlənmiş'].map(c => (
                  <label key={c} className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                    form.condition === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                  }`}>
                    <input type="radio" name="condition" value={c} checked={form.condition === c}
                      onChange={() => set('condition', c)} className="sr-only" />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Şəhər *</label>
              <select value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
                <option value="">Şəhər seçin</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-navy mb-2">Şəkillər</h2>
            <p className="text-sm text-gray-500 mb-6">Maksimum 8 şəkil. İlk şəkil üz şəkil kimi göstəriləcək.</p>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload size={32} className="text-gray-400 mb-3" />
              <span className="text-sm font-medium text-gray-600">Şəkilləri buraya sürükləyin</span>
              <span className="text-xs text-gray-400 mt-1">və ya klikləyin (maks. 8 şəkil)</span>
              <input type="file" multiple accept="image/*" className="sr-only" />
            </label>
          </div>
        )}

        {/* Step 3: Price */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-navy mb-2">Qiymət</h2>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Qiymət (₼)</label>
              <div className="relative">
                <input type="number" placeholder="0" value={form.price}
                  onChange={e => set('price', e.target.value)} disabled={form.negotiable}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 pr-10" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₼</span>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => set('negotiable', !form.negotiable)}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${form.negotiable ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.negotiable ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-gray-700">Qiymət razılaşma ilə</span>
            </label>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-navy mb-6">Nəzərdən keçirin</h2>
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={15} /> {submitError}
              </div>
            )}
            {!user && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                ⚠️ Elanı yerləşdirmək üçün əvvəlcə{' '}
                <button onClick={() => navigate('/login', { state: { from: '/sell' } })}
                  className="font-semibold underline">daxil olun</button>.
              </div>
            )}
            <div className="space-y-0 divide-y divide-gray-100">
              {[
                { label: 'Kateqoriya', value: CATEGORIES.find(c => c.id === form.category)?.label || '—' },
                { label: 'Başlıq',     value: form.title || '—' },
                { label: 'Vəziyyət',   value: form.condition },
                { label: 'Şəhər',      value: form.city || '—' },
                { label: 'Qiymət',     value: form.negotiable ? 'Razılaşma ilə' : form.price ? `${form.price} ₼` : '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start py-3">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium text-navy text-right max-w-xs">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between gap-3">
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 border border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Geri
            </button>
          : <div />
        }
        {step < STEPS.length - 1
          ? <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
              Davam et <ChevronRight size={18} />
            </button>
          : <button onClick={handleSubmit} disabled={submitting || !user}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2">
              {submitting ? 'Yerləşdirilir...' : <><Check size={18} /> Elanı yerləşdir</>}
            </button>
        }
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CITIES } from '../data/mockData'
import Logo from '../components/Logo'

const EMPTY = {
  email: '', password: '', confirmPassword: '',
  fullName: '', phone: '', city: '',
  accountType: 'individual', companyName: '',
}

export default function Register() {
  const [form, setForm]     = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const navigate = useNavigate()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Şifrələr uyğun gəlmir.')
      return
    }
    if (form.password.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    })

    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id:           data.user.id,
        full_name:    form.fullName,
        email:        form.email,
        phone:        form.phone || null,
        account_type: form.accountType,
        company_name: form.accountType === 'supplier' ? form.companyName : null,
        city:         form.city || null,
      })
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/"><Logo height={34} /></Link>
          <h1 className="text-2xl font-bold text-navy mt-6 mb-1">Hesab yaradın</h1>
          <p className="text-sm text-gray-500">Pulsuz qeydiyyatdan keçin</p>
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
              <label className="block text-sm font-medium text-navy mb-2">Hesab növü</label>
              <div className="flex gap-3">
                {[{ value: 'individual', label: 'Fərdi' }, { value: 'supplier', label: 'Təchizatçı' }].map(({ value, label }) => (
                  <label key={value} className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                    form.accountType === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}>
                    <input type="radio" name="accountType" value={value} checked={form.accountType === value} onChange={() => set('accountType', value)} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Ad Soyad *</label>
              <input type="text" required value={form.fullName} onChange={e => set('fullName', e.target.value)}
                placeholder="Əli Əliyev"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>

            {form.accountType === 'supplier' && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Şirkət adı *</label>
                <input type="text" required value={form.companyName} onChange={e => set('companyName', e.target.value)}
                  placeholder="HoreqTech MMC"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-navy mb-1.5">Telefon</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+994 50 XXX XX XX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-navy mb-1.5">Şəhər</label>
                <select value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="">Seçin</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">E-poçt *</label>
              <input type="email" required autoComplete="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-navy mb-1.5">Şifrə *</label>
                <input type="password" required autoComplete="new-password" value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Min. 6 simvol"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-navy mb-1.5">Təsdiqlə *</label>
                <input type="password" required autoComplete="new-password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors mt-1">
              {loading ? 'Hesab yaradılır...' : 'Qeydiyyatdan keç'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Artıq hesabınız var?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Daxil olun</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

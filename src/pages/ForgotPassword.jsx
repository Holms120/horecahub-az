import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      <Helmet><title>Şifrəni sıfırla — HorecaHub</title></Helmet>
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-navy mb-2">Şifrəni sıfırla</h1>
        {sent ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-semibold mb-2">Email göndərildi!</p>
            <p className="text-gray-500 text-sm mb-6">Emailinizi yoxlayın, şifrə sıfırlama linki göndərildi.</p>
            <Link to="/login" className="text-blue-600 hover:underline text-sm">Girişə qayıt</Link>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">Emailinizi daxil edin, şifrə sıfırlama linki göndərəcəyik.</p>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
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
                {loading ? 'Göndərilir...' : 'Göndər'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-blue-600 hover:underline">Girişə qayıt</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

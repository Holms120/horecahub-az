import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Phone, ShieldCheck, Package, Calendar } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { normalizeListing } from '../lib/normalize'
import ListingCard from '../components/ListingCard'

export default function Profile() {
  const { id } = useParams()
  const [profile, setProfile]   = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [pRes, lRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase
          .from('listings')
          .select('*, profiles(id, full_name, company_name, account_type, logo_url, phone)')
          .eq('user_id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
      ])

      if (pRes.error) setError('Profil tapılmadı.')
      else setProfile(pRes.data)

      if (!lRes.error) setListings((lRes.data || []).map(normalizeListing))
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-navy mb-2">Profil tapılmadı</h2>
        <p className="text-gray-500 mb-6">Bu istifadəçi mövcud deyil.</p>
        <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
          Ana səhifəyə qayıt
        </Link>
      </div>
    )
  }

  const displayName = profile.company_name || profile.full_name || 'İstifadəçi'
  const initial = displayName.charAt(0).toUpperCase()
  const memberYear = profile.created_at ? new Date(profile.created_at).getFullYear() : ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl flex-shrink-0 overflow-hidden">
            {profile.logo_url
              ? <img src={profile.logo_url} alt={displayName} className="w-full h-full object-cover" />
              : initial
            }
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-navy">{displayName}</h1>
              {profile.account_type === 'supplier' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={12} /> Doğrulanmış Təchizatçı
                </span>
              )}
            </div>
            {profile.description && (
              <p className="text-gray-600 text-sm mb-3 max-w-xl">{profile.description}</p>
            )}
            <div className="flex items-center gap-5 text-sm text-gray-500 flex-wrap">
              {profile.city && (
                <span className="flex items-center gap-1.5"><MapPin size={14} />{profile.city}</span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1.5"><Phone size={14} />{profile.phone}</span>
              )}
              <span className="flex items-center gap-1.5"><Package size={14} />{listings.length} aktiv elan</span>
              {memberYear && (
                <span className="flex items-center gap-1.5"><Calendar size={14} />{memberYear}-dən üzv</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-navy">Elanlar</h2>
        <span className="text-sm text-gray-500">{listings.length} elan</span>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500">Bu istifadəçinin aktiv elanı yoxdur.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MapPin, Phone, ShieldCheck, Package, Calendar, Pencil, Heart, Tag, Eye } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { normalizeListing } from '../lib/normalize'
import ListingCard from '../components/ListingCard'
import { useTranslation } from 'react-i18next'

export default function Profile() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const SUPPLIER_CAT_LABELS = {
    meat:            t('supplierCategories.meat'),
    vegetables:      t('supplierCategories.vegetables'),
    dairy:           t('supplierCategories.dairy'),
    coffee_tea:      t('supplierCategories.coffee_tea'),
    beverages:       t('supplierCategories.beverages'),
    cleaning:        t('supplierCategories.cleaning'),
    packaging:       t('supplierCategories.packaging'),
    equipment_parts: t('supplierCategories.equipment_parts'),
    other:           t('supplierCategories.other'),
  }

  const isOwn = user?.id === id
  const [profileTab, setProfileTab] = useState(
    searchParams.get('tab') === 'favorites' ? 'favorites' : 'listings'
  )

  const [profile, setProfile]     = useState(null)
  const [listings, setListings]   = useState([])
  const [viewCounts, setViewCounts] = useState({})
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading]     = useState(true)
  const [favLoading, setFavLoading] = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [pRes, lRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase
          .from('listings')
          .select('*, profiles!left(id, full_name, company_name, account_type, logo_url, phone)')
          .eq('user_id', id)
          .in('status', ['active', 'pending'])
          .order('created_at', { ascending: false }),
      ])

      if (pRes.error) setError('Profil tapılmadı.')
      else setProfile(pRes.data)

      const normalizedListings = (lRes.data || []).map(normalizeListing)
      if (!lRes.error) setListings(normalizedListings)

      // Load view counts for own profile
      if (user?.id === id && normalizedListings.length > 0) {
        const ids = normalizedListings.map(l => l.id)
        const { data: vData } = await supabase
          .from('listing_views')
          .select('listing_id')
          .in('listing_id', ids)
        const vc = {}
        ;(vData || []).forEach(v => { vc[v.listing_id] = (vc[v.listing_id] || 0) + 1 })
        setViewCounts(vc)
      }

      setLoading(false)
    }
    load()
  }, [id, user?.id])

  // Fetch favorites when isOwn + favorites tab active
  useEffect(() => {
    if (!isOwn || !user || profileTab !== 'favorites') return
    async function loadFavorites() {
      setFavLoading(true)
      const { data: favData } = await supabase
        .from('favorites').select('listing_id').eq('user_id', user.id)

      const ids = (favData || []).map(f => f.listing_id)
      if (ids.length === 0) { setFavorites([]); setFavLoading(false); return }

      const { data: listingsData } = await supabase
        .from('listings')
        .select('*, profiles!left(id, full_name, company_name, account_type, logo_url, phone)')
        .in('id', ids)
        .eq('status', 'active')

      setFavorites((listingsData || []).map(normalizeListing))
      setFavLoading(false)
    }
    loadFavorites()
  }, [isOwn, user, profileTab])

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
        <h2 className="text-xl font-bold text-navy mb-2">{t('profile.notFound')}</h2>
        <p className="text-gray-500 mb-6">{t('profile.notFoundDesc')}</p>
        <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
          {t('profile.backHome')}
        </Link>
      </div>
    )
  }

  const displayName = profile.full_name || profile.company_name || 'İstifadəçi'
  const initial     = displayName.charAt(0).toUpperCase()
  const memberYear  = profile.created_at ? new Date(profile.created_at).getFullYear() : ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>{`${profile.full_name || profile.company_name || 'Profil'} — HorecaHub`}</title>
        <meta property="og:title" content={`${profile.full_name || profile.company_name || 'Profil'} — HorecaHub.az`} />
        <meta property="og:url" content={`https://horecahub.az/profile/${profile.id}`} />
      </Helmet>
      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl flex-shrink-0 overflow-hidden border-2 border-gray-100">
            {profile.logo_url
              ? <img src={profile.logo_url} alt={displayName} className="w-full h-full object-cover" />
              : initial
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-navy">{displayName}</h1>
                {profile.account_type === 'supplier' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    <ShieldCheck size={12} /> {t('profile.verified')}
                  </span>
                )}
              </div>
              {isOwn && (
                <Link to="/edit-profile"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-navy text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Pencil size={14} /> {t('profile.edit')}
                </Link>
              )}
            </div>

            {profile.description && (
              <p className="text-gray-600 text-sm mb-4 max-w-xl leading-relaxed">{profile.description}</p>
            )}

            <div className="flex items-center gap-5 text-sm text-gray-500 flex-wrap">
              {profile.city && <span className="flex items-center gap-1.5"><MapPin size={14} />{profile.city}</span>}
              {profile.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{profile.phone}</span>}
              {profile.account_type === 'supplier' && profile.phone2 && (
                <span className="flex items-center gap-1.5"><Phone size={14} />{profile.phone2}</span>
              )}
              <span className="flex items-center gap-1.5"><Package size={14} />{listings.length} {t('profile.activeListings')}</span>
              {memberYear && <span className="flex items-center gap-1.5"><Calendar size={14} />{memberYear}{t('profile.memberSince')}</span>}
            </div>

            {/* Supplier categories */}
            {profile.account_type === 'supplier' &&
              Array.isArray(profile.supplier_categories) &&
              profile.supplier_categories.length > 0 && (
              <div className="mt-4 flex items-start gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-400 font-medium mt-0.5 flex-shrink-0">
                  <Tag size={12} /> {t('profile.supplierCategories')}
                </span>
                {profile.supplier_categories.map(cat => (
                  <span key={cat}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {SUPPLIER_CAT_LABELS[cat] || cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs — only for own profile */}
      {isOwn && (
        <div className="flex gap-2 mb-6">
          {[
            { value: 'listings',  label: t('profile.tabListings'),  count: listings.length },
            { value: 'favorites', label: t('profile.tabFavorites'), icon: Heart },
          ].map(tab => (
            <button key={tab.value} onClick={() => setProfileTab(tab.value)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                profileTab === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-navy hover:bg-gray-50'
              }`}>
              {tab.icon && <tab.icon size={14} className={profileTab === tab.value ? 'text-white' : 'text-red-400'} />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  profileTab === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {profileTab === 'listings' || !isOwn ? (
        <>
          {!isOwn && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy">{t('profile.tabListings')}</h2>
              <span className="text-sm text-gray-500">{listings.length} elan</span>
            </div>
          )}
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-500">
                {isOwn ? t('profile.noListingsOwn') : t('profile.noListingsOther')}
              </p>
              {isOwn && (
                <Link to="/sell"
                  className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
                  {t('profile.postFirst')}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map(l => (
                <div key={l.id} className="flex flex-col">
                  <div className="relative">
                    <ListingCard listing={l} />
                    {isOwn && l.status === 'pending' && (
                      <div className="absolute top-2 right-8 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Gözləmədə
                      </div>
                    )}
                  </div>
                  {isOwn && (
                    <div className="flex items-center gap-3 mt-1 px-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye size={11} /> {viewCounts[l.id] || 0} baxış
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Favorites tab */
        favLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="text-5xl mb-4">🤍</div>
            <p className="text-gray-500 font-medium mb-1">{t('profile.noFavorites')}</p>
            <p className="text-gray-400 text-sm mb-6">{t('profile.favoritesHint')}</p>
            <Link to="/listings"
              className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
              {t('profile.browseListings')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )
      )}
    </div>
  )
}

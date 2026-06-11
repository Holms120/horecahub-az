import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Search, ChefHat, Coffee, Thermometer, UtensilsCrossed,
  LayoutGrid, Wine, Users, Truck, ShieldCheck, MessageCircle,
  Target, ArrowRight, Plus, Briefcase, Monitor, GraduationCap,
  Package, Store
} from 'lucide-react'
import { CATEGORIES } from '../data/mockData'
import { supabase } from '../supabaseClient'
import { normalizeListing } from '../lib/normalize'
import ListingCard from '../components/ListingCard'
import { useTranslation } from 'react-i18next'

const ICON_MAP = {
  ChefHat, Coffee, Thermometer, UtensilsCrossed,
  LayoutGrid, Wine, Users, Truck, Briefcase, Monitor, GraduationCap,
  Package, Store,
}

const CAT_COLORS = [
  'bg-orange-50 text-orange-600 border-orange-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-blue-50 text-blue-600 border-blue-100',
  'bg-purple-50 text-purple-600 border-purple-100',
  'bg-emerald-50 text-emerald-600 border-emerald-100',
  'bg-pink-50 text-pink-600 border-pink-100',
  'bg-indigo-50 text-indigo-600 border-indigo-100',
  'bg-teal-50 text-teal-600 border-teal-100',
]

export default function Home() {
  const { t, i18n } = useTranslation()
  const [query, setQuery]       = useState('')
  const [category, setCategory] = useState('')
  const [listings, setListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [stats, setStats] = useState({ listings: 0, sellers: 0 })
  const navigate = useNavigate()

  const trustItems = [
    { Icon: ShieldCheck, color: 'bg-green-50 text-green-600', title: t('home.verified'), desc: t('home.verifiedDesc') },
    { Icon: MessageCircle, color: 'bg-blue-50 text-blue-600', title: t('home.direct'), desc: t('home.directDesc') },
    { Icon: Target, color: 'bg-purple-50 text-purple-600', title: t('home.niche'), desc: t('home.nicheDesc') },
  ]

  useEffect(() => {
    async function fetchData() {
      setLoadingListings(true)
      const [latestRes, countRes, sellersRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*, profiles!left(id, full_name, company_name, account_type, logo_url, phone)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('listings')
          .select('user_id')
          .eq('status', 'active'),
      ])
      setListings((latestRes.data || []).map(normalizeListing))
      const totalListings = countRes.count ?? 0
      const uniqueSellers = new Set((sellersRes.data || []).map(r => r.user_id)).size
      setStats({ listings: totalListings, sellers: uniqueSellers })
      setLoadingListings(false)
    }
    fetchData()
  }, [i18n.language])

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    navigate(`/listings?${params.toString()}`)
  }

  return (
    <div>
      <Helmet>
        <title>{`HorecaHub — ${t('hero.title')}`}</title>
        <meta name="description" content="Azərbaycanda HoReCa sektoru üçün ilk marketplace. Avadanlıq, kadr və təchizatçı elanları. Vasitəçisiz, birbaşa. Pulsuz qeydiyyat." />
        <meta property="og:title" content="HorecaHub — HoReCa Marketplace" />
        <meta property="og:description" content="Avadanlıq, kadr və təchizatçı elanları. Vasitəçisiz, birbaşa." />
        <meta property="og:image" content="https://horecahub.az/logo.png" />
        <meta property="og:url" content="https://horecahub.az" />
      </Helmet>
      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-navy to-blue-700 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <p className="text-blue-200 text-xs font-semibold tracking-widest uppercase mb-3">
            {t('hero.badge')}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-blue-100 text-base md:text-lg mb-10 max-w-xl mx-auto">
            {t('hero.subtitle')}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="sm:w-44 flex-shrink-0 px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="">{t('hero.allCategories')}</option>
              {CATEGORIES.filter(c => !['staff', 'suppliers'].includes(c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('hero.searchPlaceholder')}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-800 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 bg-gray-50"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search size={16} />
                <span className="hidden sm:inline">{t('hero.searchBtn')}</span>
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-blue-200">
            <span><strong className="text-white text-lg">{stats.listings}</strong> {t('hero.listings')}</span>
            <span className="w-px h-4 bg-blue-500" />
            <span><strong className="text-white text-lg">{stats.sellers}</strong> {t('hero.sellers')}</span>
            <span className="w-px h-4 bg-blue-500" />
            <span><strong className="text-white text-lg">{CATEGORIES.length}</strong> {t('hero.categories')}</span>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-navy">{t('home.categoriesTitle')}</h2>
            <button
              onClick={() => navigate('/listings')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              {t('home.viewAll')} <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {CATEGORIES.filter(c => !['staff', 'suppliers', 'consulting', 'software', 'training'].includes(c.id)).map((cat, i) => {
              const Icon = ICON_MAP[cat.icon]
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/listings?category=${cat.id}`)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-blue-400 hover:shadow-sm transition-all duration-150 ${CAT_COLORS[i]}`}
                >
                  {Icon && <Icon size={24} />}
                  <span className="text-xs font-semibold text-center leading-tight text-navy">
                    {t(cat.key) || cat.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── LATEST LISTINGS ── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-navy">{t('home.latestListings')}</h2>
            <button
              onClick={() => navigate('/listings')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              {t('home.viewAll')} <ArrowRight size={15} />
            </button>
          </div>

          {loadingListings ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-600 font-medium mb-2">{t('home.noListings')}</p>
              <p className="text-gray-400 text-sm mb-6">{t('home.beFirst')}</p>
              <button
                onClick={() => navigate('/sell')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                {t('home.postListing')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST SECTION ── */}
      <section id="how" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-blue-600 mb-2">{t('home.whyTitle')}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-navy">{t('home.whySubtitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustItems.map(({ Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-md transition-shadow">
                <div className={`inline-flex p-4 rounded-2xl mb-5 ${color}`}>
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold text-navy mb-3">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('home.ctaBanner')}
          </h2>
          <p className="text-blue-100 mb-8">
            {t('home.ctaBannerSub')}
          </p>
          <button
            onClick={() => navigate('/sell')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Plus size={18} />
            {t('home.ctaBannerBtn')}
          </button>
        </div>
      </section>
    </div>
  )
}

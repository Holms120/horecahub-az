import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SlidersHorizontal, X, ChevronDown, Search, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { normalizeListing } from '../lib/normalize'
import { sanitizeSearch } from '../lib/search'
import ListingCard from '../components/ListingCard'
import FilterSidebar from '../components/FilterSidebar'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

const EMPTY_FILTERS = {
  category: '', priceMin: '', priceMax: '',
  conditions: [], paymentTypes: [], subcategories: [], city: '', verifiedOnly: false,
}

const PAGE_SIZE = 20

export default function Listings() {
  const { t, i18n } = useTranslation()

  const SORT_OPTIONS = [
    { value: 'newest',     label: t('listings.newest') },
    { value: 'price_asc',  label: t('listings.cheapest') },
    { value: 'price_desc', label: t('listings.expensive') },
  ]

  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [listings, setListings]         = useState([])
  const [viewCounts, setViewCounts]     = useState({})
  const [favIds, setFavIds]             = useState(() => new Set())
  const [totalCount, setTotalCount]     = useState(0)
  const [loading, setLoading]           = useState(true)
  const [fetchError, setFetchError]     = useState('')
  const [filters, setFilters]           = useState({
    ...EMPTY_FILTERS,
    category: searchParams.get('category') || '',
  })
  const [sort, setSort]               = useState('newest')
  const [query, setQuery]             = useState(searchParams.get('q') || '')
  const [sellerType, setSellerType]   = useState(searchParams.get('seller_type') || '')
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [page, setPage]               = useState(1)
  const [staffTab, setStaffTab]       = useState('cv')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate    = useNavigate()
  const searchRef   = useRef(null)

  useEffect(() => {
    if (!query.length) { setSuggestions([]); setShowSuggestions(false); return }
    const timer = setTimeout(async () => {
      const term = sanitizeSearch(query)
      if (!term) { setSuggestions([]); setShowSuggestions(false); return }
      const { data } = await supabase
        .from('listings')
        .select('id, title, keywords')
        .eq('status', 'active')
        .or(`title.ilike.%${term}%,keywords.ilike.%${term}%`)
        .limit(6)
      setSuggestions(data || [])
      setShowSuggestions(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function onClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSuggestionClick(suggestion) {
    setShowSuggestions(false)
    navigate(`/listings/${suggestion.id}`)
  }

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setFetchError('')

    let q = supabase
      .from('listings')
      .select('*, listing_type, experience_years, work_type, skills, bio, certifications, requirements, other_description, profiles!left(id, full_name, company_name, account_type, logo_url, phone)', { count: 'exact' })
      .eq('status', 'active')

    const term = sanitizeSearch(query)
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%,keywords.ilike.%${term}%`)
    if (filters.category) q = q.eq('category', filters.category)
    if (filters.subcategories?.length) q = q.in('subcategory', filters.subcategories)
    if (filters.city) q = q.eq('city', filters.city)
    if (filters.conditions.length) q = q.in('condition', filters.conditions)
    if (filters.paymentTypes?.length) q = q.overlaps('payment_type', filters.paymentTypes)
    if (filters.priceMin) q = q.gte('price', Number(filters.priceMin))
    if (filters.priceMax) q = q.lte('price', Number(filters.priceMax))
    if (sellerType === 'supplier') q = q.eq('profiles.account_type', 'supplier')

    if (filters.category === 'staff') {
      if (staffTab === 'vacancy') {
        q = q.eq('listing_type', 'vacancy')
      } else {
        q = q.or('listing_type.is.null,listing_type.neq.vacancy')
      }
    }

    if (sort === 'price_asc') q = q.order('price', { ascending: true })
    else if (sort === 'price_desc') q = q.order('price', { ascending: false })
    else q = q.order('created_at', { ascending: false })

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    q = q.range(from, to)

    const { data, error, count } = await q

    if (error) {
      setFetchError(error.message)
      setListings([])
      setTotalCount(0)
    } else {
      let normalized = (data || []).map(normalizeListing)
      if (filters.verifiedOnly) {
        normalized = normalized.filter(l => l.seller.accountType === 'supplier')
      }
      setListings(normalized)
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [query, filters, sort, page, staffTab, sellerType])

  useEffect(() => { fetchListings() }, [fetchListings])

  // Batch-load view counts and the user's favorites for the whole page in
  // two queries, instead of each ListingCard firing its own pair (N+1).
  useEffect(() => {
    if (!listings.length) { setViewCounts({}); setFavIds(new Set()); return }
    const ids = listings.map(l => l.id)
    let ignore = false
    ;(async () => {
      const [vRes, fRes] = await Promise.all([
        supabase.from('listing_views').select('listing_id').in('listing_id', ids),
        user
          ? supabase.from('favorites').select('listing_id').eq('user_id', user.id).in('listing_id', ids)
          : Promise.resolve({ data: [] }),
      ])
      if (ignore) return
      const vc = {}
      ;(vRes.data || []).forEach(v => { vc[v.listing_id] = (vc[v.listing_id] || 0) + 1 })
      setViewCounts(vc)
      setFavIds(new Set((fRes.data || []).map(f => f.listing_id)))
    })()
    return () => { ignore = true }
  }, [listings, user])

  useEffect(() => {
    setFilters(f => ({ ...f, category: searchParams.get('category') || '' }))
    setQuery(searchParams.get('q') || '')
    setSellerType(searchParams.get('seller_type') || '')
  }, [searchParams])

  useEffect(() => { setPage(1) }, [filters, query, staffTab, sort])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function clearFilters() { setFilters(EMPTY_FILTERS); setQuery(''); setStaffTab('cv') }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>{t('listings.title')}</title>
        <meta name="description" content={t('listings.metaDesc')} />
      </Helmet>

      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{t('listings.error')} {fetchError}</span>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1" ref={searchRef}>
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder={t('listings.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={e => e.key === 'Escape' && setShowSuggestions(false)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onMouseDown={e => { e.preventDefault(); handleSuggestionClick(s) }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 last:border-0"
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="appearance-none pl-3 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white text-navy">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button onClick={() => setDrawerOpen(true)}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-navy hover:bg-gray-50">
          <SlidersHorizontal size={16} /> {t('listings.filters')}
        </button>
      </div>

      {/* Staff tabs */}
      {(filters.category === 'staff' || searchParams.get('category') === 'staff') && (
        <div className="flex gap-2 mb-4">
          {[
            { value: 'cv',      label: t('listings.cvs') },
            { value: 'vacancy', label: t('listings.vacancies') },
          ].map(tab => (
            <button key={tab.value} onClick={() => setStaffTab(tab.value)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                staffTab === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-navy hover:bg-gray-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 mb-6">
        <span className="font-semibold text-navy">{totalCount}</span> {t('listings.results')}
      </p>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-5">
            <FilterSidebar filters={filters} onChange={setFilters} onClear={clearFilters} />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            totalCount === 0 && !query && !filters.category && !filters.city ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-lg font-semibold text-navy mb-2">{t('listings.noListings')}</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {t('listings.beFirst')}
                </p>
                <a href="/sell"
                  className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                  {t('listings.postListing')}
                </a>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-navy mb-2">{t('listings.noResults')}</h3>
                <p className="text-gray-500 text-sm mb-6">{t('listings.tryFilters')}</p>
                <button onClick={clearFilters}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                  {t('listings.clearFilters')}
                </button>
              </div>
            )
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    viewCount={viewCounts[listing.id] || 0}
                    favorited={user ? favIds.has(listing.id) : false}
                  />
                ))}
              </div>
              {totalCount > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                  >
                    {t('listings.prev')}
                  </button>
                  <span className="text-sm text-gray-500 px-3">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                  >
                    {t('listings.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-semibold text-navy">{t('listings.filters')}</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-gray-500 hover:text-navy">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar filters={filters} onChange={setFilters} onClear={clearFilters} />
              <button onClick={() => setDrawerOpen(false)}
                className="w-full mt-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                {t('listings.apply')} ({totalCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

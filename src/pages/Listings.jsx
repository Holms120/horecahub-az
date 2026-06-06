import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SlidersHorizontal, X, ChevronDown, Search, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { normalizeListing } from '../lib/normalize'
import ListingCard from '../components/ListingCard'
import FilterSidebar from '../components/FilterSidebar'
import { useTranslation } from 'react-i18next'

const EMPTY_FILTERS = {
  category: '', priceMin: '', priceMax: '',
  conditions: [], paymentTypes: [], subcategories: [], city: '', verifiedOnly: false,
}

export default function Listings() {
  const { t, i18n } = useTranslation()

  const SORT_OPTIONS = [
    { value: 'newest',     label: t('listings.newest') },
    { value: 'price_asc',  label: t('listings.cheapest') },
    { value: 'price_desc', label: t('listings.expensive') },
  ]

  const [searchParams] = useSearchParams()
  const [allListings, setAllListings] = useState([])
  const [loading, setLoading]         = useState(true)
  const [fetchError, setFetchError]   = useState('')
  const [filters, setFilters]         = useState({
    ...EMPTY_FILTERS,
    category: searchParams.get('category') || '',
  })
  const [sort, setSort]               = useState('newest')
  const [query, setQuery]             = useState(searchParams.get('q') || '')
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [visibleCount, setVisibleCount] = useState(12)
  const [staffTab, setStaffTab]       = useState('cv')

  useEffect(() => {
    async function fetchListings() {
      setLoading(true)
      setFetchError('')
      const { data, error } = await supabase
        .from('listings')
        .select('*, listing_type, experience_years, work_type, skills, bio, certifications, requirements, other_description, profiles!left(id, full_name, company_name, account_type, logo_url, phone)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        setFetchError(error.message)
      } else {
        setAllListings((data || []).map(normalizeListing))
      }
      setLoading(false)
    }
    fetchListings()
  }, [i18n.language])

  useEffect(() => {
    setFilters(f => ({ ...f, category: searchParams.get('category') || '' }))
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const filtered = useMemo(() => {
    let items = [...allListings]
    if (query) {
      const q = query.toLowerCase()
      items = items.filter(l =>
        l.title.toLowerCase().includes(q) || l.categoryLabel.toLowerCase().includes(q)
      )
    }
    if (filters.category)           items = items.filter(l => l.category === filters.category)
    if (filters.priceMin) {
      const min = Number(filters.priceMin)
      items = items.filter(l => l.price >= min)
    }
    if (filters.priceMax) {
      const max = Number(filters.priceMax)
      items = items.filter(l => l.price <= max)
    }
    if (filters.conditions.length)            items = items.filter(l => filters.conditions.includes(l.condition))
    if (filters.paymentTypes?.length)          items = items.filter(l => filters.paymentTypes.includes(l.paymentType || 'cash'))
    if (filters.subcategories?.length)         items = items.filter(l => filters.subcategories.includes(l.subcategory))
    if (filters.city)                         items = items.filter(l => l.city === filters.city)
    if (filters.verifiedOnly)                 items = items.filter(l => l.seller.isVerified)
    if (filters.category === 'staff') {
      const cvListings      = items.filter(l => l.listingType !== 'vacancy')
      const vacancyListings = items.filter(l => l.listingType === 'vacancy')
      items = staffTab === 'vacancy' ? vacancyListings : cvListings
    }

    if (sort === 'price_asc')       items.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') items.sort((a, b) => b.price - a.price)
    return items
  }, [allListings, filters, query, sort, staffTab])

  const visible = filtered.slice(0, visibleCount)

  function clearFilters() { setFilters(EMPTY_FILTERS); setQuery(''); setStaffTab('cv') }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

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
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder={t('listings.searchPlaceholder')}
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
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
        <span className="font-semibold text-navy">{filtered.length}</span> {t('listings.results')}
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
          {visible.length === 0 ? (
            allListings.length === 0 ? (
              /* DB-də heç bir elan yoxdur */
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
              /* Filter nəticəsi boşdur */
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
                {visible.map(listing => <ListingCard key={listing.id} listing={listing} />)}
              </div>
              {visibleCount < filtered.length && (
                <div className="text-center mt-10">
                  <button onClick={() => setVisibleCount(c => c + 12)}
                    className="px-8 py-3 border border-blue-600 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                    {t('listings.loadMore')} ({filtered.length - visibleCount})
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
                {t('listings.apply')} ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

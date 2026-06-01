import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Search, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { normalizeListing } from '../lib/normalize'
import ListingCard from '../components/ListingCard'
import FilterSidebar from '../components/FilterSidebar'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Ən yeni' },
  { value: 'price_asc',  label: 'Ən ucuz' },
  { value: 'price_desc', label: 'Ən bahalı' },
]

const EMPTY_FILTERS = {
  category: '', priceMin: '', priceMax: '',
  conditions: [], city: '', verifiedOnly: false,
}

export default function Listings() {
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

  useEffect(() => {
    async function fetchListings() {
      setLoading(true)
      setFetchError('')
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles(id, full_name, company_name, account_type, logo_url, phone)')
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
  }, [])

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
    if (filters.priceMin)           items = items.filter(l => l.price >= Number(filters.priceMin))
    if (filters.priceMax)           items = items.filter(l => l.price > 0 && l.price <= Number(filters.priceMax))
    if (filters.conditions.length)  items = items.filter(l => filters.conditions.includes(l.condition))
    if (filters.city)               items = items.filter(l => l.city === filters.city)
    if (filters.verifiedOnly)       items = items.filter(l => l.seller.isVerified)

    if (sort === 'price_asc')       items.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') items.sort((a, b) => b.price - a.price)
    return items
  }, [allListings, filters, query, sort])

  const visible = filtered.slice(0, visibleCount)

  function clearFilters() { setFilters(EMPTY_FILTERS); setQuery('') }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>Elanlar yüklənərkən xəta baş verdi: {fetchError}</span>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Elan axtar..."
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
          <SlidersHorizontal size={16} /> Filtrlər
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        <span className="font-semibold text-navy">{filtered.length}</span> nəticə tapıldı
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
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-navy mb-2">Nəticə tapılmadı</h3>
              <p className="text-gray-500 text-sm mb-6">Filtrləri dəyişdirməyə cəhd edin</p>
              <button onClick={clearFilters}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                Filtrləri sıfırla
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {visible.map(listing => <ListingCard key={listing.id} listing={listing} />)}
              </div>
              {visibleCount < filtered.length && (
                <div className="text-center mt-10">
                  <button onClick={() => setVisibleCount(c => c + 12)}
                    className="px-8 py-3 border border-blue-600 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                    Daha çox yüklə ({filtered.length - visibleCount} elan qalıb)
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
              <span className="font-semibold text-navy">Filtrlər</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1 text-gray-500 hover:text-navy">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar filters={filters} onChange={setFilters} onClear={clearFilters} />
              <button onClick={() => setDrawerOpen(false)}
                className="w-full mt-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                Tətbiq et ({filtered.length} nəticə)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

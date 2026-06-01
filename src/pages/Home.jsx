import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, ChefHat, Coffee, Thermometer, UtensilsCrossed,
  LayoutGrid, Wine, Users, Truck, ShieldCheck, MessageCircle,
  Target, ArrowRight, Plus
} from 'lucide-react'
import { CATEGORIES, LISTINGS } from '../data/mockData'
import ListingCard from '../components/ListingCard'

const ICON_MAP = {
  ChefHat, Coffee, Thermometer, UtensilsCrossed,
  LayoutGrid, Wine, Users, Truck,
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
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    navigate(`/listings?${params.toString()}`)
  }

  const featured = LISTINGS.filter(l => l.isFeatured).slice(0, 8)
  const recent = LISTINGS.slice(0, 8)

  return (
    <div>
      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-navy to-blue-700 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-blue-200 text-xs font-semibold tracking-widest uppercase mb-3">
            Azərbaycanda ilk
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            HoReCa üçün <span className="text-blue-300">Marketplace</span>
          </h1>
          <p className="text-blue-100 text-base md:text-lg mb-10 max-w-xl mx-auto">
            Avadanlıq, kadr, təchizatçı — hamısı bir yerdə. Vasitəçisiz, birbaşa.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="sm:w-44 flex-shrink-0 px-3 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              <option value="">Bütün kateqoriyalar</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nə axtarırsınız?"
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
                <span className="hidden sm:inline">Axtar</span>
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-blue-200">
            <span><strong className="text-white text-lg">479</strong> Listinq</span>
            <span className="w-px h-4 bg-blue-500" />
            <span><strong className="text-white text-lg">200+</strong> Satıcı</span>
            <span className="w-px h-4 bg-blue-500" />
            <span><strong className="text-white text-lg">8</strong> Kateqoriya</span>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-navy">Kateqoriyalar</h2>
            <button
              onClick={() => navigate('/listings')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              Hamısına bax <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat, i) => {
              const Icon = ICON_MAP[cat.icon]
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/listings?category=${cat.id}`)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-blue-400 hover:shadow-sm transition-all duration-150 ${CAT_COLORS[i]}`}
                >
                  {Icon && <Icon size={24} />}
                  <span className="text-xs font-semibold text-center leading-tight text-navy">
                    {cat.label}
                  </span>
                  <span className="text-xs text-gray-400">{cat.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ── */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-navy">Seçilmiş elanlar</h2>
            <button
              onClick={() => navigate('/listings')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              Hamısına bax <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT LISTINGS ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-navy">Son əlavə edilənlər</h2>
            <button
              onClick={() => navigate('/listings')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              Hamısına bax <ArrowRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recent.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SECTION ── */}
      <section id="how" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase text-blue-600 mb-2">Niyə HorecaHub?</p>
            <h2 className="text-2xl md:text-3xl font-bold text-navy">Sektora xüsusi, sıfır kompromis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                Icon: ShieldCheck,
                color: 'bg-green-50 text-green-600',
                title: 'Doğrulanmış satıcılar',
                desc: 'Hər satıcı əl ilə yoxlanılır. Doğrulama nişanı olan profillər 100% etibarlıdır.',
              },
              {
                Icon: MessageCircle,
                color: 'bg-blue-50 text-blue-600',
                title: 'Birbaşa əlaqə',
                desc: 'Heç bir vasitəçi yoxdur. Alıcı ilə satıcı birbaşa danışır, razılaşır.',
              },
              {
                Icon: Target,
                color: 'bg-purple-50 text-purple-600',
                title: 'HoReCa-ya xüsusi',
                desc: 'Yalnız hotel, restoran və kafe sektoru üçün. Ümumi bazarların əksinə.',
              },
            ].map(({ Icon, color, title, desc }) => (
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
            Avadanlığınızı satmaq istəyirsiniz?
          </h2>
          <p className="text-blue-100 mb-8">
            Pulsuz listinq yerləşdirin. 5 dəqiqəyə hazır.
          </p>
          <button
            onClick={() => window.location.href = '/sell'}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Plus size={18} />
            Pulsuz listinq yerləşdir
          </button>
        </div>
      </section>
    </div>
  )
}

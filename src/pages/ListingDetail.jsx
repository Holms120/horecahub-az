import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Clock, Heart, Share2, ShieldCheck,
  Star, ChevronLeft, MessageSquare, Phone, ArrowRight
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { normalizeListing } from '../lib/normalize'
import ListingCard from '../components/ListingCard'

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing]     = useState(null)
  const [similar, setSimilar]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [liked, setLiked]         = useState(false)
  const [contacted, setContacted] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles(id, full_name, company_name, account_type, logo_url, phone)')
        .eq('id', id)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const normalized = normalizeListing(data)
      setListing(normalized)

      // Fetch similar
      const { data: simData } = await supabase
        .from('listings')
        .select('*, profiles(id, full_name, company_name, account_type, logo_url)')
        .eq('category', data.category)
        .eq('status', 'active')
        .neq('id', id)
        .limit(4)

      setSimilar((simData || []).map(normalizeListing))
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

  if (notFound || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-navy mb-2">Elan tapılmadı</h2>
        <p className="text-gray-500 mb-6">Bu elan mövcud deyil və ya silinmişdir.</p>
        <Link to="/listings" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
          Elanlara qayıt
        </Link>
      </div>
    )
  }

  const { title, price, condition, city, date, images, description, seller, categoryLabel, priceLabel } = listing
  const displayPrice = price > 0 ? `${price.toLocaleString('az-AZ')} ₼` : (priceLabel || 'Razılaşma ilə')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-navy transition-colors">
          <ChevronLeft size={16} /> Geri
        </button>
        <span>/</span>
        <Link to="/listings" className="hover:text-navy">Elanlar</Link>
        <span>/</span>
        <span className="text-navy font-medium truncate max-w-xs">{title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-3">
            <img src={images[activeImg] || images[0]} alt={title}
              className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    activeImg === i ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              condition === 'Yeni' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {condition}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setLiked(v => !v)}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Heart size={18} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
              </button>
              <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Share2 size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-navy mb-3 leading-snug">{title}</h1>
          <p className="text-3xl font-bold text-blue-600 mb-4">{displayPrice}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100 flex-wrap">
            <span className="flex items-center gap-1.5"><MapPin size={14} />{city}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} />{date}</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">{categoryLabel}</span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 mb-8">
            <button onClick={() => setContacted(true)}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Phone size={18} />
              {contacted && seller.phone
                ? seller.phone
                : contacted ? 'Nömrə mövcud deyil'
                : 'Əlaqə saxla'}
            </button>
            <button className="w-full py-3.5 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <MessageSquare size={18} /> Mesaj yaz
            </button>
          </div>

          {/* Seller card */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg overflow-hidden flex-shrink-0">
                {seller.logoUrl
                  ? <img src={seller.logoUrl} alt={seller.name} className="w-full h-full object-cover" />
                  : seller.name.charAt(0).toUpperCase()
                }
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-navy">{seller.name}</span>
                  {seller.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold">
                      <ShieldCheck size={11} /> Doğrulanmış
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-500">
                    {seller.rating} · {seller.memberSince && `${seller.memberSince}-dən`}
                  </span>
                </div>
              </div>
            </div>
            {seller.id && (
              <Link to={`/profile/${seller.id}`}
                className="block w-full py-2.5 text-center border border-gray-200 rounded-xl text-sm font-medium text-navy hover:bg-white transition-colors">
                Profili gör →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-14 max-w-3xl">
        <h2 className="text-lg font-bold text-navy mb-4">Təsvir</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy">Oxşar elanlar</h2>
            <Link to={`/listings?category=${listing.category}`}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Hamısına bax <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {similar.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
        <div className="flex gap-3">
          <button className="flex-1 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-50">
            Mesaj yaz
          </button>
          <button onClick={() => setContacted(true)}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700">
            {contacted ? 'Nömrəni göstər' : 'Əlaqə saxla'}
          </button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  )
}

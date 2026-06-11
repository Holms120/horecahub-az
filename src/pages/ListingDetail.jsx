import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  MapPin, Clock, Heart, Share2, ShieldCheck,
  Star, ChevronLeft, MessageSquare, Phone, ArrowRight, Send, CheckCircle2,
  Pencil, Trash2, Eye
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { normalizeListing } from '../lib/normalize'
import ListingCard from '../components/ListingCard'
import { useTranslation } from 'react-i18next'
import { useRelativeTime } from '../hooks/useRelativeTime'

export default function ListingDetail() {
  const { t }        = useTranslation()
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const msgRef       = useRef(null)

  const [listing, setListing]     = useState(null)
  const [similar, setSimilar]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [activeImg, setActiveImg]     = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading]   = useState(false)

  // View count
  const [viewCount, setViewCount] = useState(0)

  // Phone reveal
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [sellerPhone, setSellerPhone]     = useState('')
  const [phoneFetching, setPhoneFetching] = useState(false)

  // Messaging
  const [msgOpen, setMsgOpen]     = useState(false)
  const [msgText, setMsgText]     = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [msgSent, setMsgSent]     = useState(false)

  const timeDisplay = useRelativeTime(listing?.createdAt)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles!left(id, full_name, company_name, account_type, logo_url, phone)')
        .eq('id', id)
        .single()

      if (error || !data) { setNotFound(true); setLoading(false); return }

      const normalized = normalizeListing(data)
      setListing(normalized)
      setSellerPhone(normalized.seller.phone || '')

      const { data: simData } = await supabase
        .from('listings')
        .select('*, profiles!left(id, full_name, company_name, account_type, logo_url, phone)')
        .eq('category', data.category)
        .eq('status', 'active')
        .neq('id', id)
        .limit(4)

      setSimilar((simData || []).map(normalizeListing))
      setLoading(false)
    }
    load()
  }, [id])


  // Track view
  useEffect(() => {
    if (!id) return
    supabase.from("listing_views").insert({ listing_id: id }).then(({ error }) => { if (error) console.error("view error:", error) })
  }, [id])
  // Fetch view count
  useEffect(() => {
    if (!id) return
    supabase
      .from('listing_views')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', id)
      .then(({ count }) => setViewCount(count || 0))
  }, [id])

  // Fetch favorite status
  useEffect(() => {
    if (!user || !id) return
    supabase.from('favorites').select('id')
      .eq('user_id', user.id).eq('listing_id', id).maybeSingle()
      .then(({ data }) => setIsFavorited(!!data))
  }, [user, id])

  async function toggleFavorite() {
    if (!user) { navigate('/login', { state: { from: `/listings/${id}` } }); return }
    setFavLoading(true)
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', id)
      setIsFavorited(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: id })
      setIsFavorited(true)
    }
    setFavLoading(false)
  }

  async function revealPhone() {
    if (phoneRevealed) return
    setPhoneFetching(true)
    if (!sellerPhone && listing?.userId) {
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', listing.userId)
        .single()
      setSellerPhone(data?.phone || '')
    }
    supabase.from("phone_clicks").insert({ listing_id: id }).then(({ error }) => { if (error) console.error("phone click error:", error) })
    setPhoneRevealed(true)
    setPhoneFetching(false)
  }

  function openMsgComposer() {
    if (!user) { navigate('/login', { state: { from: `/listings/${id}` } }); return }
    setMsgOpen(v => !v)
    if (!msgOpen) {
      setTimeout(() => msgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
  }

  async function sendMessage() {
    if (!msgText.trim() || !user || !listing) return
    setSendingMsg(true)
    const { error } = await supabase.from('messages').insert({
      listing_id:  listing.id,
      sender_id:   user.id,
      receiver_id: listing.seller.id,
      content:     msgText.trim(),
    })
    if (!error) { setMsgText(''); setMsgSent(true); setMsgOpen(false) }
    setSendingMsg(false)
  }

  async function handleDelete() {
    if (!window.confirm(t('listingDetail.deleteConfirm'))) return
    const { error } = await supabase
      .from('listings')
      .update({ status: 'deleted' })
      .eq('id', listing.id)
      .eq('user_id', user.id)
    if (!error) navigate('/listings')
  }

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
        <h2 className="text-xl font-bold text-navy mb-2">{t('listingDetail.notFound')}</h2>
        <p className="text-gray-500 mb-6">{t('listingDetail.notFoundDesc')}</p>
        <Link to="/listings" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
          {t('listingDetail.backToListings')}
        </Link>
      </div>
    )
  }

  const { title, price, condition, city, images, description, seller, categoryKey, categoryLabel, subcategoryLabel, otherDescription, paymentType, userId } = listing
  const displayPrice = listing.category === 'staff'
    ? `₼${price.toLocaleString('az-AZ')}${t('listingDetail.perMonth')}`
    : `₼${price.toLocaleString('az-AZ')}`
  const isOwner      = !!(user && userId && user.id === userId)
  const ptKey        = paymentType || 'cash'
  const PAYMENT_LABELS = { cash: t('filter.cash'), credit: t('filter.credit'), order: t('filter.order') }
  const PAYMENT_BADGE  = { cash: 'bg-blue-50 text-blue-700', credit: 'bg-amber-50 text-amber-700', order: 'bg-purple-50 text-purple-700' }

  const EXP_MAP = {
    less_1:   t('listingDetail.exp1'),
    '1_2':    t('listingDetail.exp2'),
    '3_5':    t('listingDetail.exp3'),
    '5_10':   t('listingDetail.exp4'),
    '10_plus':t('listingDetail.exp5'),
  }
  const WORK_MAP = {
    full: t('listingDetail.fullTime'),
    part: t('listingDetail.partTime'),
    both: t('listingDetail.both'),
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Helmet>
        <title>{`${listing.title || 'Elan'} — ₼${listing.price || ''} | HorecaHub`}</title>
        <meta name="description" content={listing.description?.slice(0, 160) || listing.title || ''} />
        <meta property="og:title" content={`${title} — HorecaHub`} />
        <meta property="og:description" content={description?.slice(0, 160) || ''} />
        <meta property="og:image" content={listing.image || 'https://horecahub.az/logo.png'} />
      </Helmet>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-navy transition-colors">
          <ChevronLeft size={16} /> {t('listingDetail.back')}
        </button>
        <span>/</span>
        <Link to="/listings" className="hover:text-navy">{t('listingDetail.allListings')}</Link>
        <span>/</span>
        <span className="text-navy font-medium truncate max-w-xs">{title}</span>
      </div>

      {/* Owner actions */}
      {isOwner && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => navigate(`/listings/${id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-navy text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Pencil size={15} /> {t('listingDetail.edit')}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} /> {t('listingDetail.delete')}
          </button>
        </div>
      )}

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
            {listing.category !== 'staff' && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                condition === 'Yeni' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {condition}
              </span>
            )}
            {listing.category === 'staff' && <span />}
            <div className="flex items-center gap-2">
              <button onClick={toggleFavorite} disabled={favLoading}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
                <Heart size={18} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
              </button>
              <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Share2 size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-navy mb-3 leading-snug">
            {['staff', 'consulting', 'software', 'training'].includes(listing.category) && listing.subcategory
              ? (t('subcat.' + listing.subcategory) || title)
              : title}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-3xl font-bold text-blue-600">{displayPrice}</p>
            {listing.category !== 'staff' && (
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${PAYMENT_BADGE[ptKey] || PAYMENT_BADGE.cash}`}>
                {PAYMENT_LABELS[ptKey] || t('filter.cash')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100 flex-wrap">
            <span className="flex items-center gap-1.5"><MapPin size={14} />{city}</span>
            <span className="flex items-center gap-1.5"><Clock size={14} />{timeDisplay}</span>
            <span className="flex items-center gap-1.5"><Eye size={14} />{viewCount}</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">{(categoryKey && t(categoryKey)) || categoryLabel}</span>
            {subcategoryLabel && (
              <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{(listing.subcategory && t('subcat.' + listing.subcategory)) || subcategoryLabel}</span>
            )}
            {subcategoryLabel && otherDescription && (
              <span className="text-gray-400 text-xs">— {otherDescription}</span>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 mb-6">
            {/* Phone reveal button */}
            <button
              onClick={revealPhone}
              disabled={phoneFetching}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Phone size={18} />
              {phoneFetching
                ? t('listingDetail.loading')
                : phoneRevealed
                  ? (sellerPhone || t('listingDetail.noPhone'))
                  : (listing.category === 'staff' && listing.listingType === 'vacancy' ? t('listingDetail.apply') : t('listingDetail.contact'))}
            </button>

            {/* Message button */}
            <button
              onClick={openMsgComposer}
              className="w-full py-3.5 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} />
              {msgSent ? t('listingDetail.messageSent') : t('listingDetail.sendMessage')}
            </button>

            {/* Inline message composer */}
            {msgOpen && (
              <div ref={msgRef} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-sm font-medium text-navy mb-3">{t('listingDetail.messageComposer')}</p>
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder={t('listingDetail.messagePlaceholder')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none mb-3"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setMsgOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100">
                    {t('listingDetail.cancel')}
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!msgText.trim() || sendingMsg}
                    className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send size={14} />
                    {sendingMsg ? t('listingDetail.sending') : t('listingDetail.send')}
                  </button>
                </div>
              </div>
            )}

            {msgSent && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <CheckCircle2 size={16} />
                {t('listingDetail.messageSentDesc')}{' '}
                <Link to="/messages" className="font-semibold underline">{t('listingDetail.viewMessages')}</Link>
              </div>
            )}
          </div>

          {/* Seller card — hidden for CV listings */}
          {!(listing.category === 'staff' && listing.listingType === 'cv') && (
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
                      <ShieldCheck size={11} /> {t('listingDetail.verified')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-500">
                    {seller.rating}{seller.memberSince ? ` · ${seller.memberSince}${t('listingDetail.memberSince')}` : ''}
                  </span>
                </div>
              </div>
            </div>
            {seller.id && (
              <Link to={`/profile/${seller.id}`}
                className="block w-full py-2.5 text-center border border-gray-200 rounded-xl text-sm font-medium text-navy hover:bg-white transition-colors">
                {t('listingDetail.viewProfile')}
              </Link>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Description */}
      {listing.category !== 'staff' && description && (
        <div className="mb-14 max-w-3xl">
          <h2 className="text-lg font-bold text-navy mb-4">{t('listingDetail.description')}</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
        </div>
      )}

      {/* Staff-specific layout */}
      {listing.category === 'staff' && (
        <div className="mb-14 max-w-3xl space-y-6">
          {listing.listingType === 'cv' ? (
            <>
              {listing.bio && (
                <div>
                  <h2 className="text-lg font-bold text-navy mb-3">{t('listingDetail.about')}</h2>
                  <p className="text-gray-600 leading-relaxed">{listing.bio}</p>
                </div>
              )}
              {listing.skills.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-navy mb-3">{t('listingDetail.skills')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.skills.map(s => (
                      <span key={s} className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(listing.experienceYears || listing.workType) && (
                <div className="grid grid-cols-2 gap-4">
                  {listing.experienceYears && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">{t('listingDetail.experience')}</p>
                      <p className="text-sm font-semibold text-navy">
                        {EXP_MAP[listing.experienceYears] || listing.experienceYears}
                      </p>
                    </div>
                  )}
                  {listing.workType && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">{t('listingDetail.workType')}</p>
                      <p className="text-sm font-semibold text-navy">
                        {WORK_MAP[listing.workType] || listing.workType}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {listing.certifications && (
                <div>
                  <h2 className="text-lg font-bold text-navy mb-2">{t('listingDetail.certifications')}</h2>
                  <p className="text-gray-600 text-sm">{listing.certifications}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {listing.requirements && (
                <div>
                  <h2 className="text-lg font-bold text-navy mb-3">{t('listingDetail.requirements')}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.requirements}</p>
                </div>
              )}
              {(listing.experienceYears || listing.workType) && (
                <div className="grid grid-cols-2 gap-4">
                  {listing.experienceYears && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">{t('listingDetail.requiredExp')}</p>
                      <p className="text-sm font-semibold text-navy">
                        {EXP_MAP[listing.experienceYears] || listing.experienceYears}
                      </p>
                    </div>
                  )}
                  {listing.workType && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">{t('listingDetail.workType')}</p>
                      <p className="text-sm font-semibold text-navy">
                        {WORK_MAP[listing.workType] || listing.workType}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {description && (
                <div>
                  <h2 className="text-lg font-bold text-navy mb-3">{t('listingDetail.additionalInfo')}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy">{t('listingDetail.similarListings')}</h2>
            <Link to={`/listings?category=${listing.category}`}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              {t('listingDetail.viewAll')} <ArrowRight size={14} />
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
          <button onClick={openMsgComposer}
            className="flex-1 py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-50">
            {msgSent ? t('listingDetail.mobileMessage') : t('listingDetail.sendMessage')}
          </button>
          <button onClick={revealPhone} disabled={phoneFetching}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-70">
            {phoneFetching ? '...' : phoneRevealed ? (sellerPhone || t('listingDetail.mobileNoPhone')) : t('listingDetail.mobileContact')}
          </button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  )
}

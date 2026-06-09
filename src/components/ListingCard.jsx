import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MapPin, Clock, Pencil, Trash2, Eye } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useRelativeTime } from '../hooks/useRelativeTime'
import { isNewListing } from '../lib/time'

const PAYMENT_BADGE  = {
  cash:   'bg-blue-50 text-blue-700',
  credit: 'bg-amber-50 text-amber-700',
  order:  'bg-purple-50 text-purple-700',
}

export default function ListingCard({ listing }) {
  const { t } = useTranslation()
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading]   = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [viewCount, setViewCount]     = useState(0)
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const { id, title, price, condition, city, image, paymentType, userId,
          category, listingType, skills, createdAt, created_at, status } = listing

  const timeDisplay = useRelativeTime(createdAt || created_at)
  const isNew = isNewListing(createdAt || created_at)

  useEffect(() => {
    if (!id) return
    supabase
      .from('listing_views')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', id)
      .then(({ count }) => setViewCount(count || 0))
  }, [id])

  const PAYMENT_LABELS = { cash: t('listingCard.cash'), credit: t('listingCard.credit'), order: t('listingCard.order') }

  const isOwner  = !!(user && userId && user.id === userId)
  const isStaff  = category === 'staff'
  const ptKey    = paymentType || 'cash'

  const displayPrice = isStaff
    ? `₼${price.toLocaleString('az-AZ')}${t('listingDetail.perMonth')}`
    : `₼${price.toLocaleString('az-AZ')}`

  const SERVICE_CATS = ['consulting', 'software', 'training']
  const conditionBadge = isStaff
    ? (listingType === 'vacancy'
        ? { label: t('listingCard.vacancy'), cls: 'bg-purple-100 text-purple-700' }
        : { label: t('listingCard.cv'),      cls: 'bg-blue-100 text-blue-700' })
    : SERVICE_CATS.includes(category)
    ? null
    : (condition === 'Sıfır'
        ? { label: t('listingCard.unused'), cls: 'bg-green-100 text-green-700' }
        : { label: t('listingCard.used'),   cls: 'bg-gray-100 text-gray-600' })

  // Fetch favorite status
  useEffect(() => {
    if (!user || !id) return
    supabase.from('favorites').select('id')
      .eq('user_id', user.id).eq('listing_id', id).maybeSingle()
      .then(({ data }) => setIsFavorited(!!data))
  }, [user, id])

  async function toggleFavorite(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    setFavLoading(true)
    if (isFavorited) {
      await supabase.from('favorites').delete()
        .eq('user_id', user.id).eq('listing_id', id)
      setIsFavorited(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: id })
      setIsFavorited(true)
    }
    setFavLoading(false)
  }

  async function handleDelete(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(t('listingCard.deleteConfirm'))) return
    setDeleting(true)
    await supabase.from('listings').update({ status: 'deleted' })
      .eq('id', id).eq('user_id', user.id)
    window.location.reload()
  }

  return (
    <Link
      to={`/listings/${id}`}
      className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isNew ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold bg-green-500 text-white">
            {t('listingCard.newListing')}
          </span>
        ) : conditionBadge ? (
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold ${conditionBadge.cls}`}>
            {conditionBadge.label}
          </span>
        ) : null}
        {isOwner && status === 'pending' && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500 text-white">
            Gözləmədə
          </span>
        )}
        <button
          onClick={toggleFavorite}
          disabled={favLoading}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:scale-110 transition-transform disabled:opacity-50"
          aria-label={t('listingCard.addToFavorites')}
        >
          <Heart size={15} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-navy line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">
          {['staff', 'consulting', 'software', 'training'].includes(category) && listing.subcategory
            ? (t('subcat.' + listing.subcategory) || title)
            : title}
        </p>

        {isStaff && listingType === 'cv' && skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {skills.slice(0, 3).map(s => (
              <span key={s} className="bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <p className="text-base font-bold text-blue-600">{displayPrice}</p>
          {!isStaff && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PAYMENT_BADGE[ptKey] || PAYMENT_BADGE.cash}`}>
              {PAYMENT_LABELS[ptKey] || t('listingCard.cash')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1"><MapPin size={11} />{city}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1"><Eye size={11} />{viewCount}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{timeDisplay}</span>
          </div>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex gap-2 pt-2 mt-2 border-t border-gray-100 overflow-hidden">
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/listings/${id}/edit`) }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors min-w-0 flex-1"
            >
              <Pencil size={11} className="flex-shrink-0" />
              <span className="truncate">{t('listingCard.edit')}</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 min-w-0 flex-1"
            >
              <Trash2 size={11} className="flex-shrink-0" />
              <span className="truncate">{deleting ? '...' : t('listingCard.delete')}</span>
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}

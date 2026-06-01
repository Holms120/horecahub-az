import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Clock } from 'lucide-react'

export default function ListingCard({ listing }) {
  const [liked, setLiked] = useState(false)
  const { id, title, price, condition, city, date, image, priceLabel } = listing

  const displayPrice = price > 0
    ? `${price.toLocaleString('az-AZ')} ₼`
    : (priceLabel || 'Razılaşma ilə')

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
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold ${
          condition === 'Yeni'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {condition}
        </span>
        <button
          onClick={e => { e.preventDefault(); setLiked(v => !v) }}
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:scale-110 transition-transform"
          aria-label="Seçilmişlərə əlavə et"
        >
          <Heart
            size={15}
            className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
          />
        </button>
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-navy line-clamp-2 leading-snug mb-2 min-h-[2.5rem]">
          {title}
        </p>
        <p className="text-base font-bold text-blue-600 mb-2">{displayPrice}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {city}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {date}
          </span>
        </div>
      </div>
    </Link>
  )
}

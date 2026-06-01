import { CATEGORIES } from '../data/mockData'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80'

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'İndi'
  if (mins < 60) return `${mins} dəq. əvvəl`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} saat əvvəl`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days} gün əvvəl`
  return new Date(dateStr).toLocaleDateString('az-AZ')
}

export function normalizeListing(row) {
  if (!row) return null
  const profile = row.profiles || {}
  const images = Array.isArray(row.images) && row.images.length > 0
    ? row.images
    : [PLACEHOLDER]

  return {
    id: row.id,
    title: row.title || '',
    price: Number(row.price) || 0,
    condition: row.condition === 'new' ? 'Yeni' : 'İşlənmiş',
    city: row.city || '',
    date: timeAgo(row.created_at),
    category: row.category || '',
    categoryLabel: CATEGORIES.find(c => c.id === row.category)?.label || row.category || '',
    image: images[0],
    images,
    description: row.description || '',
    isFeatured: false,
    priceLabel: !row.price || Number(row.price) === 0 ? 'Razılaşma ilə' : null,
    seller: {
      id: profile.id || row.user_id || '',
      name: profile.company_name || profile.full_name || 'İstifadəçi',
      rating: 4.5,
      isVerified: profile.account_type === 'supplier',
      totalListings: 0,
      memberSince: row.created_at ? String(new Date(row.created_at).getFullYear()) : '',
      phone: profile.phone || '',
      logoUrl: profile.logo_url || '',
    },
  }
}

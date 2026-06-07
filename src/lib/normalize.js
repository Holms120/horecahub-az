import { CATEGORIES, SUBCATEGORIES } from '../data/mockData'
import i18n from '../i18n/index.js'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80'

const STAFF_PLACEHOLDERS = {
  barista:    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
  head_chef:  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
  chef:       'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
  waiter:     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80',
  bartender:  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80',
  baker:      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
  smm:        'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=400&q=80',
  designer:   'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=400&q=80',
  manager:    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
}
const VACANCY_PLACEHOLDER = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=400&q=80'
const STAFF_DEFAULT       = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80'

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return i18n.t('time.now')
  if (mins < 60) return i18n.t('time.minsAgo', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return i18n.t('time.hoursAgo', { count: hrs })
  const days = Math.floor(hrs / 24)
  if (days < 7)  return i18n.t('time.daysAgo', { count: days })
  const locale = i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'en' ? 'en-US' : 'az-AZ'
  return new Date(dateStr).toLocaleDateString(locale)
}

export function normalizeListing(row) {
  if (!row) return null
  // Debug: verify listing_type for staff (remove after fix confirmed)
  if (row.category === 'staff') {
    console.log('[normalize] staff id:', row.id, '| listing_type raw:', row.listing_type, '| resolved:', row.listing_type ?? 'item')
  }
  const profile = row.profiles || {}
  const hasImages = Array.isArray(row.images) && row.images.length > 0
  let fallback = PLACEHOLDER
  if (!hasImages && row.category === 'staff') {
    fallback = row.listing_type === 'vacancy'
      ? VACANCY_PLACEHOLDER
      : (STAFF_PLACEHOLDERS[row.subcategory] || STAFF_DEFAULT)
  }
  const images = hasImages ? row.images : [fallback]

  const sellerName =
    profile.full_name ||
    profile.company_name ||
    'İstifadəçi'

  return {
    id: row.id,
    title: row.title || '',
    price: row.price != null ? Number(row.price) : 0,
    condition: row.condition === 'new' ? 'Yeni' : 'İşlənmiş',
    city: row.city || '',
    date: timeAgo(row.created_at),
    createdAt: row.created_at || '',
    category: row.category || '',
    categoryKey:   CATEGORIES.find(c => c.id === row.category)?.key   || '',
    categoryLabel: CATEGORIES.find(c => c.id === row.category)?.label || row.category || '',
    subcategory: row.subcategory || '',
    subcategoryLabel: SUBCATEGORIES[row.category]?.find(s => s.id === row.subcategory)?.label || '',
    otherDescription: row.other_description || '',
    listingType:    row.listing_type ?? 'item',
    experienceYears: row.experience_years || '',
    workType:       row.work_type       || '',
    skills:         Array.isArray(row.skills) ? row.skills : [],
    bio:            row.bio             || '',
    certifications: row.certifications  || '',
    requirements:   row.requirements    || '',
    image: images[0],
    images,
    description: row.description || '',
    isFeatured: false,
    paymentType: row.payment_type || 'cash',
    userId: row.user_id || '',
    seller: {
      id: profile.id || row.user_id || '',
      name: sellerName,
      rating: 4.5,
      isVerified: profile.account_type === 'supplier',
      totalListings: 0,
      memberSince: row.created_at ? String(new Date(row.created_at).getFullYear()) : '',
      phone: profile.phone || '',
      logoUrl: profile.logo_url || '',
    },
  }
}

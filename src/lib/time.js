/** Supabase timestamptz values are UTC; parse consistently regardless of Z suffix. */
export function parseSupabaseTimestamp(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).trim()
  if (/[Zz]$|[+-]\d{2}(:\d{2})?$/.test(s)) {
    return new Date(s)
  }
  const iso = s.includes('T') ? s : s.replace(' ', 'T')
  return new Date(`${iso}Z`)
}

export const NEW_LISTING_MS = 48 * 60 * 60 * 1000

export function isNewListing(createdAt) {
  const date = parseSupabaseTimestamp(createdAt)
  if (!date || Number.isNaN(date.getTime())) return false
  return Date.now() - date.getTime() < NEW_LISTING_MS
}

export function formatRelativeTime(dateStr, t, language = 'az') {
  const date = parseSupabaseTimestamp(dateStr)
  if (!date || Number.isNaN(date.getTime())) return ''

  const diff = Date.now() - date.getTime()
  if (diff < 0) return t('time.now')

  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('time.now')
  if (mins < 60) return mins === 1 ? t('time.minAgo') : t('time.minsAgo', { count: mins })

  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs === 1 ? t('time.hourAgo') : t('time.hoursAgo', { count: hrs })

  const days = Math.floor(hrs / 24)
  if (days < 7) return days === 1 ? t('time.dayAgo') : t('time.daysAgo', { count: days })

  const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'az-AZ'
  return date.toLocaleDateString(locale)
}

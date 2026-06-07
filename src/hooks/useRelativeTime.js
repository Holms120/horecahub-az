import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatRelativeTime } from '../lib/time'

export function useRelativeTime(dateStr) {
  const { t, i18n } = useTranslation()
  return useMemo(
    () => formatRelativeTime(dateStr, t, i18n.language),
    [dateStr, t, i18n.language],
  )
}

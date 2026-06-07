import { useRelativeTime } from '../hooks/useRelativeTime'

export default function RelativeTime({ dateStr, className }) {
  const label = useRelativeTime(dateStr)
  if (!label) return null
  return <span className={className}>{label}</span>
}

interface PriorityBadgeProps {
  priority: string | null | undefined
}

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border border-red-300',
  HIGH: 'bg-orange-100 text-orange-700 border border-orange-300',
  MEDIUM: 'bg-blue-100 text-blue-700 border border-blue-300',
  LOW: 'bg-gray-100 text-gray-600 border border-gray-300',
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return null

  // DB se priority lowercase aa sakti hai ('high', 'medium', 'low')
  // aur AI suggestions se uppercase ('HIGH', 'MEDIUM', 'LOW') — dono handle karne
  // ke liye normalize karte hain, taaki color aur text hamesha match karein
  const normalized = priority.toUpperCase()
  const style = PRIORITY_STYLES[normalized] || PRIORITY_STYLES.MEDIUM

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {normalized}
    </span>
  )
}
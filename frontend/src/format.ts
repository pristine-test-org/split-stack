const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return dateFmt.format(new Date(value))
}

export function timeAgo(value: string): string {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} d ago`
  return formatDate(value)
}

export function dueLabel(value: string): { text: string; overdue: boolean } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${value}T00:00:00`)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { text: `${-days} d overdue`, overdue: true }
  if (days === 0) return { text: 'Due today', overdue: false }
  if (days === 1) return { text: 'Due tomorrow', overdue: false }
  return { text: `Due in ${days} d`, overdue: false }
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

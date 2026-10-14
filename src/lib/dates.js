export const todayISO = () => toISODate(new Date())

export function toISODate(value) {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addDays(value, amount) {
  const date = new Date(`${value}T12:00:00`)
  date.setDate(date.getDate() + amount)
  return toISODate(date)
}

export function daysBetween(from, to) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  return Math.round((end - start) / 86400000)
}

export function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return ''
  return new Intl.DateTimeFormat(undefined, options).format(new Date(`${value}T12:00:00`))
}

export function startOfWeek(value) {
  const date = new Date(`${value}T12:00:00`)
  date.setDate(date.getDate() - date.getDay())
  return toISODate(date)
}

export function relativeDate(value) {
  const delta = daysBetween(todayISO(), value)
  if (delta === 0) return 'Today'
  if (delta === 1) return 'Tomorrow'
  if (delta === -1) return 'Yesterday'
  if (delta < 0) return `${Math.abs(delta)} days ago`
  return `In ${delta} days`
}

export function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return `${remainder}m`
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}
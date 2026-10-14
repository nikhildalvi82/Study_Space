import { CalendarDays } from 'lucide-react'

export default function EmptyState({ icon: Icon = CalendarDays, title, message, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={20} /></div><strong>{title}</strong><p>{message}</p>{action}</div>
}
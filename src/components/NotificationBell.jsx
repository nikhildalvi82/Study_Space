import { useEffect, useRef, useState } from 'react'
import { Bell, CircleAlert, GraduationCap } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { getReminders, notifyOnceDaily } from '../lib/notifications'

export default function NotificationBell() {
  const { data } = useData()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const reminders = getReminders(data)
  useEffect(() => {
    const close = (event) => { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  useEffect(() => { notifyOnceDaily(reminders) }, [reminders.length])
  const requestNotifications = async () => {
    if (!('Notification' in window)) { toast('Browser notifications are not available here.', 'error'); return }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') { notifyOnceDaily(reminders); toast('Daily browser reminders are enabled.') }
    else toast('Browser notification permission was not granted.', 'error')
  }
  return <div ref={root} style={{ position: 'relative' }}>
    <button className="icon-button" aria-label="Open reminders" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Bell size={17} />{reminders.length > 0 && <span className="notification-dot" />}</button>
    {open && <div className="notification-menu"><div className="section-title"><h2>Reminders</h2><span className="badge">{reminders.length}</span></div>
      {!reminders.length ? <p className="muted small">You’re all caught up.</p> : reminders.map((item) => <div className="notification-item" key={item.id}><strong>{item.kind === 'exam' ? <GraduationCap size={13} /> : <CircleAlert size={13} />} {item.title}</strong><span style={item.overdue ? { color: '#c3424e' } : undefined}>{item.detail}</span></div>)}
      <button className="button button-small" style={{ width: '100%', marginTop: 10 }} onClick={requestNotifications}>Enable browser reminders</button>
    </div>}
  </div>
}
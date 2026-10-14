import { addDays, daysBetween, todayISO } from './dates'

export function getReminders(data) {
  const today = todayISO()
  const assignments = (data.assignments || []).filter((item) => item.status !== 'done').map((item) => {
    const days = daysBetween(today, item.dueDate)
    return days <= 3 ? { id: `assignment-${item.id}`, title: item.title, detail: days < 0 ? `Overdue by ${Math.abs(days)} days` : days === 0 ? 'Due today' : `Due ${days === 1 ? 'tomorrow' : `in ${days} days`}`, date: item.dueDate, overdue: days < 0, kind: 'assignment' } : null
  }).filter(Boolean)
  const exams = (data.exams || []).filter((exam) => {
    const days = daysBetween(today, exam.date)
    return days >= 0 && days <= 7
  }).map((exam) => ({ id: `exam-${exam.id}`, title: exam.name, detail: `${daysBetween(today, exam.date) === 0 ? 'Exam today' : `Exam in ${daysBetween(today, exam.date)} days`}`, date: exam.date, kind: 'exam' }))
  return [...assignments, ...exams].sort((a, b) => a.date.localeCompare(b.date))
}

export function notifyOnceDaily(reminders) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const key = `study-space-notified-${todayISO()}`
  if (!reminders.length || localStorage.getItem(key)) return
  new Notification('Study Space reminders', { body: `${reminders.length} item${reminders.length === 1 ? '' : 's'} need your attention.` })
  localStorage.setItem(key, 'true')
}

export { addDays }
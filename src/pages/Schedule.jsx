import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import BlockRow from '../components/BlockRow'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { buildDay } from '../lib/scheduler'
import { addDays, daysBetween, formatDate, todayISO, toISODate } from '../lib/dates'

export default function Schedule() {
  const { data, updateData } = useData()
  const { toast } = useToast()
  const [view, setView] = useState('Day')
  const [anchor, setAnchor] = useState(todayISO())
  const today = todayISO()
  const move = (amount) => setAnchor((current) => {
    if (view !== 'Month') return addDays(current, amount * (view === 'Day' ? 1 : 7))
    const date = new Date(`${current}T12:00:00`)
    date.setDate(1)
    date.setMonth(date.getMonth() + amount)
    return toISODate(date)
  })
  const startWeek = useMemo(() => { const date = new Date(`${anchor}T12:00:00`); date.setDate(date.getDate() - date.getDay()); return toISODate(date) }, [anchor])
  const monthStart = useMemo(() => `${anchor.slice(0, 7)}-01`, [anchor])
  const gridStart = useMemo(() => { const date = new Date(`${monthStart}T12:00:00`); date.setDate(date.getDate() - date.getDay()); return toISODate(date) }, [monthStart])
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startWeek, index))
  const timeline = useMemo(() => buildDay(data, anchor), [data, anchor])
  const studyBlocks = timeline.filter((item) => item.type === 'study')
  const completedBlocks = studyBlocks.filter((block) => data.sessions.some((session) => session.source === `plan:${anchor}:${block.id}`))
  const dayItems = [...data.exams.filter((item) => item.date === anchor).map((item) => ({ id: item.id, title: item.name, kind: 'Exam' })), ...data.assignments.filter((item) => item.dueDate === anchor).map((item) => ({ id: item.id, title: item.title, kind: 'Assignment' }))]
  const eventsByDate = (date) => [
    ...data.exams.filter((item) => item.date === date).map((item) => ({ id: item.id, title: item.name, kind: 'exam' })),
    ...data.assignments.filter((item) => item.dueDate === date).map((item) => ({ id: item.id, title: item.title, kind: 'assignment' })),
  ]
  const setDate = async (kind, id, date) => {
    const field = kind === 'exam' ? 'date' : 'dueDate'
    try {
      await updateData((current) => ({ ...current, [kind === 'exam' ? 'exams' : 'assignments']: current[kind === 'exam' ? 'exams' : 'assignments'].map((item) => item.id === id ? { ...item, [field]: date } : item) }))
      toast(`${kind === 'exam' ? 'Exam' : 'Assignment'} date updated.`)
    } catch { toast('The date could not be updated.', 'error') }
  }
  const dragStart = (event, item) => event.dataTransfer.setData('text/plain', JSON.stringify(item))
  const dropOnDate = (event, date) => {
    event.preventDefault()
    try { const item = JSON.parse(event.dataTransfer.getData('text/plain')); setDate(item.kind, item.id, date) } catch { toast('That item could not be moved.', 'error') }
  }
  const toggleBlock = async (block) => {
    const source = `plan:${anchor}:${block.id}`
    const existing = data.sessions.find((session) => session.source === source)
    try { await updateData((current) => ({ ...current, sessions: existing ? current.sessions.filter((session) => session.source !== source) : [...current.sessions, { id: source, date: anchor, minutes: block.minutes, subject: block.subject, source, createdAt: new Date().toISOString() }] })) }
    catch { toast('Your progress could not be saved.', 'error') }
  }
  const heading = view === 'Day' ? formatDate(anchor, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : view === 'Week' ? `${formatDate(startWeek)} – ${formatDate(addDays(startWeek, 6), { month: 'short', day: 'numeric', year: 'numeric' })}` : formatDate(monthStart, { month: 'long', year: 'numeric' })
  return <>
    <PageHeader eyebrow="Plan your time" title="Schedule" subtitle="Your study plan, one day at a time." />
    <div className="schedule-toolbar"><div className="view-switch" role="tablist" aria-label="Calendar view">{['Day', 'Week', 'Month'].map((item) => <button role="tab" aria-selected={view === item} className={view === item ? 'selected' : ''} key={item} onClick={() => setView(item)}>{item}</button>)}</div><div className="date-controls"><button className="icon-button" aria-label="Previous period" onClick={() => move(-1)}><ChevronLeft size={16} /></button><strong>{heading}</strong><button className="icon-button" aria-label="Next period" onClick={() => move(1)}><ChevronRight size={16} /></button><button className="button button-small" onClick={() => setAnchor(today)}>Today</button></div></div>
    {view === 'Day' && <>
      <section className="stat-grid" style={{ marginBottom: 16 }}><article className="card stat-card"><div className="stat-top">Planned study</div><div className="stat-value">{(studyBlocks.reduce((sum, item) => sum + item.minutes, 0) / 60).toFixed(1)}h</div><div className="stat-caption">Across {studyBlocks.length} focus blocks</div></article><article className="card stat-card"><div className="stat-top">Completed</div><div className="stat-value">{(completedBlocks.reduce((sum, item) => sum + item.minutes, 0) / 60).toFixed(1)}h</div><div className="stat-caption">Tick a block when you finish</div></article><article className="card stat-card" style={{ gridColumn: 'span 2' }}><div className="section-title"><div><div className="stat-top">Daily progress</div><div className="stat-value" style={{ fontSize: 18, margin: '8px 0' }}>{completedBlocks.length} of {studyBlocks.length} blocks</div></div><span className="badge badge-blue">{studyBlocks.length ? Math.round(completedBlocks.length / studyBlocks.length * 100) : 0}%</span></div><ProgressBar value={studyBlocks.length ? completedBlocks.length / studyBlocks.length * 100 : 0} /></article></section>
      <section className="card card-pad"><div className="section-title"><div><h2>Daily timeline</h2><p className="muted small" style={{ margin: '5px 0 0' }}>Generated from your routine and study goals</p></div></div>{timeline.length ? <div className="timeline">{timeline.map((block) => <BlockRow key={block.id} block={block} checked={data.sessions.some((session) => session.source === `plan:${anchor}:${block.id}`)} onToggle={() => toggleBlock(block)} />)}</div> : <EmptyState title="No study blocks yet" message="Add subjects and daily study hours to generate your timetable." />}</section>
      <section className="card card-pad" style={{ marginTop: 16 }}><div className="section-title"><h2>Due this day</h2><span className="badge">{dayItems.length}</span></div>{dayItems.length ? dayItems.map((item) => <div className="list-row" key={`${item.kind}-${item.id}`}><div><div className="list-title">{item.title}</div><div className="list-meta">{item.kind}</div></div><span className={`badge ${item.kind === 'Exam' ? 'badge-orange' : 'badge-green'}`}>{item.kind}</span></div>) : <EmptyState title="Nothing due on this day" message="Exams and assignments with this date appear here." />}</section>
    </>}
    {view === 'Week' && <div className="week-grid">{weekDays.map((date) => <div className={`week-day ${date === today ? 'today' : ''}`} key={date} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnDate(event, date)}><div className="week-title">{formatDate(date, { weekday: 'short', day: 'numeric' })}</div>{eventsByDate(date).map((item) => <div className={`week-item ${item.kind}`} key={`${item.kind}-${item.id}`} draggable onDragStart={(event) => dragStart(event, item)} title="Drag to change date">{item.title}</div>)}{!eventsByDate(date).length && <span className="muted small">No deadlines</span>}</div>)}</div>}
    {view === 'Month' && <div className="calendar-scroll"><div className="calendar-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div className="calendar-cell calendar-head" key={day}>{day}</div>)}{monthDays.map((date) => <div className={`calendar-cell ${date.slice(0, 7) !== monthStart.slice(0, 7) ? 'outside' : ''}`} key={date} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnDate(event, date)}><div className={`calendar-day ${date === today ? 'today' : ''}`}>{new Date(`${date}T12:00:00`).getDate()}</div>{eventsByDate(date).map((item) => <div className={`calendar-chip ${item.kind}`} key={`${item.kind}-${item.id}`} draggable onDragStart={(event) => dragStart(event, item)} title="Drag to change date">{item.title}</div>)}</div>)}</div></div>}
    {view !== 'Day' && <p className="muted small" style={{ marginTop: 12 }}>Drag an exam or assignment to another day to update its date.</p>}
  </>
}
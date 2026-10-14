import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { revisionPlan } from '../lib/scheduler'
import { daysBetween, formatDate, todayISO } from '../lib/dates'

const blankExam = { name: '', subject: '', date: todayISO(), topicsText: '' }

export default function Exams() {
  const { data, updateData } = useData()
  const { toast } = useToast()
  const [editing, setEditing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(blankExam)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState({})
  const today = todayISO()
  const upcoming = data.exams.filter((exam) => exam.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = data.exams.filter((exam) => exam.date < today).sort((a, b) => b.date.localeCompare(a.date))
  const open = (exam) => { setEditing(exam?.id || null); setForm(exam ? { name: exam.name, subject: exam.subject, date: exam.date, topicsText: exam.topics.map((topic) => topic.name).join('\n') } : { ...blankExam, subject: data.profile?.subjects?.[0]?.name || '' }); setError(''); setModalOpen(true) }
  const save = async (event) => {
    event.preventDefault()
    const names = [...new Set(form.topicsText.split('\n').map((name) => name.trim()).filter(Boolean))]
    if (!form.name.trim() || !form.subject || !form.date) { setError('Add an exam name, subject, and date.'); return }
    if (!names.length) { setError('Add at least one syllabus topic.'); return }
    const previous = data.exams.find((exam) => exam.id === editing)
    const topics = names.map((name) => ({ id: previous?.topics.find((topic) => topic.name.toLowerCase() === name.toLowerCase())?.id || crypto.randomUUID(), name, done: Boolean(previous?.topics.find((topic) => topic.name.toLowerCase() === name.toLowerCase())?.done) }))
    const next = { id: editing || crypto.randomUUID(), name: form.name.trim(), subject: form.subject, date: form.date, topics }
    try { await updateData((current) => ({ ...current, exams: editing ? current.exams.map((exam) => exam.id === editing ? next : exam) : [...current.exams, next] })); setModalOpen(false); toast(editing ? 'Exam updated.' : 'Exam added.') }
    catch { setError('The exam could not be saved. Please try again.') }
  }
  const toggleTopic = async (exam, topicId) => {
    try { await updateData((current) => ({ ...current, exams: current.exams.map((item) => item.id === exam.id ? { ...item, topics: item.topics.map((topic) => topic.id === topicId ? { ...topic, done: !topic.done } : topic) } : item) })) }
    catch { toast('Topic progress could not be saved.', 'error') }
  }
  const remove = async (exam) => {
    if (!window.confirm(`Delete “${exam.name}”? This cannot be undone.`)) return
    try { await updateData((current) => ({ ...current, exams: current.exams.filter((item) => item.id !== exam.id) })); toast('Exam deleted.') }
    catch { toast('The exam could not be deleted.', 'error') }
  }
  const examCard = (exam, isPast = false) => {
    const days = daysBetween(today, exam.date)
    const done = exam.topics.filter((topic) => topic.done).length
    const plan = revisionPlan(exam, today)
    return <article className="card card-pad" key={exam.id} style={{ marginBottom: 12, opacity: isPast ? .82 : 1 }}>
      <div className="section-title"><div style={{ minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><h2>{exam.name}</h2><span className="badge badge-blue">{exam.subject}</span></div><p className="muted small" style={{ margin: '7px 0 0' }}>{formatDate(exam.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {isPast ? 'Past exam' : days === 0 ? 'Today' : `${days} days left`}</p></div><div className="row-actions"><button className="icon-button" aria-label={`Edit ${exam.name}`} onClick={() => open(exam)}><BookOpen size={15} /></button><button className="icon-button" aria-label={`Delete ${exam.name}`} onClick={() => remove(exam)}><Trash2 size={15} /></button></div></div>
      {!isPast && <span className={`badge ${days <= 3 ? 'badge-red' : 'badge-orange'}`} style={{ marginBottom: 12 }}>{days === 0 ? 'Exam today' : days === 1 ? '1 day to go' : `${days} days to go`}</span>}
      <div className="section-title" style={{ margin: '7px 0 8px' }}><span className="muted small">Syllabus readiness</span><span className="small">{done}/{exam.topics.length} topics</span></div><ProgressBar value={exam.topics.length ? done / exam.topics.length * 100 : 0} label={`${exam.name} readiness`} />
      <div className="topic-list">{exam.topics.map((topic) => <label className="topic-row" key={topic.id}><input type="checkbox" checked={topic.done} onChange={() => toggleTopic(exam, topic.id)} /><span style={topic.done ? { textDecoration: 'line-through', color: '#9da2af' } : undefined}>{topic.name}</span></label>)}</div>
      {!isPast && <div className="revision-details"><button className="button button-quiet button-small" onClick={() => setExpanded((current) => ({ ...current, [exam.id]: !current[exam.id] }))}>{expanded[exam.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Revision plan</button>{expanded[exam.id] && <div style={{ marginTop: 8 }}>{plan.length ? plan.map((day) => <div className="revision-day" key={day.date}><strong>{formatDate(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}</strong><span className="muted">{day.topics.join(', ')}</span></div>) : <p className="muted small">All topics are complete.</p>}</div>}</div>}
    </article>
  }
  return <>
    <PageHeader eyebrow="Prepare with a plan" title="Exams" subtitle="Keep exam dates and revision topics in one place." action={<button className="button button-primary" onClick={() => open()}><Plus size={15} /> Add exam</button>} />
    <div className="section-title"><h2>Upcoming exams</h2><span className="badge">{upcoming.length}</span></div>
    {upcoming.length ? upcoming.map((exam) => examCard(exam)) : <section className="card"><EmptyState icon={BookOpen} title="No upcoming exams" message="Add an exam to make a revision plan and track each topic." action={<button className="button button-small button-primary" onClick={() => open()}>Add exam</button>} /></section>}
    {past.length > 0 && <><div className="section-title" style={{ marginTop: 28 }}><h2>Past exams</h2><span className="badge">{past.length}</span></div>{past.map((exam) => examCard(exam, true))}</>}
    {modalOpen && <Modal title={editing ? 'Edit exam' : 'Add exam'} onClose={() => setModalOpen(false)}><form onSubmit={save}>
      <div className="field"><label htmlFor="exam-name">Exam name</label><input id="exam-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Cell biology final" autoFocus /></div>
      <div className="form-grid"><div className="field"><label htmlFor="exam-subject">Subject</label><select id="exam-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}><option value="">Choose a subject</option>{(data.profile?.subjects || []).map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select></div><div className="field"><label htmlFor="exam-date">Exam date</label><input id="exam-date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div></div>
      <div className="field"><label htmlFor="exam-topics">Syllabus topics</label><textarea id="exam-topics" value={form.topicsText} onChange={(event) => setForm({ ...form, topicsText: event.target.value })} placeholder={'Cell structure\nGenetics\nEvolution'} /><span className="muted small">Add one topic per line.</span></div>
      {error && <p className="form-error" role="alert">{error}</p>}<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button-primary" type="submit">{editing ? 'Save exam' : 'Add exam'}</button></div>
    </form></Modal>}
  </>
}
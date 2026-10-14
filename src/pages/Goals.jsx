import { useState } from 'react'
import { Plus, Target, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import ProgressBar from '../components/ProgressBar'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { formatDate, relativeDate, todayISO } from '../lib/dates'

const sections = [{ id: 'weekly', label: 'Weekly goals' }, { id: 'monthly', label: 'Monthly goals' }, { id: 'semester', label: 'Semester goals' }]

export default function Goals() {
  const { data, updateData } = useData()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', targetDate: todayISO(), period: 'weekly', progress: 0 })
  const [error, setError] = useState('')
  const open = (goal, period = 'weekly') => { setEditing(goal?.id || null); setForm(goal ? { title: goal.title, targetDate: goal.targetDate, period: goal.period, progress: goal.progress } : { title: '', targetDate: todayISO(), period, progress: 0 }); setError(''); setModalOpen(true) }
  const save = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.targetDate) { setError('Add a goal title and target date.'); return }
    const goal = { ...form, title: form.title.trim(), progress: Number(form.progress), id: editing || crypto.randomUUID() }
    try { await updateData((current) => ({ ...current, goals: editing ? current.goals.map((item) => item.id === editing ? goal : item) : [...current.goals, goal] })); setModalOpen(false); toast(editing ? 'Goal updated.' : 'Goal added.') }
    catch { setError('The goal could not be saved. Please try again.') }
  }
  const updateProgress = async (goal, progress) => {
    try { await updateData((current) => ({ ...current, goals: current.goals.map((item) => item.id === goal.id ? { ...item, progress: Number(progress) } : item) })) }
    catch { toast('Goal progress could not be saved.', 'error') }
  }
  const remove = async (goal) => {
    if (!window.confirm(`Delete “${goal.title}”? This cannot be undone.`)) return
    try { await updateData((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== goal.id) })); toast('Goal deleted.') }
    catch { toast('The goal could not be deleted.', 'error') }
  }
  return <>
    <PageHeader eyebrow="Small steps, visible progress" title="Goals" subtitle="Set a target and track your progress as you go." action={<button className="button button-primary" onClick={() => open()}><Plus size={15} /> Add goal</button>} />
    {sections.map((section) => {
      const goals = data.goals.filter((goal) => goal.period === section.id)
      return <section key={section.id} style={{ marginBottom: 25 }}><div className="section-title"><div><h2>{section.label}</h2><p className="muted small" style={{ margin: '5px 0 0' }}>{goals.length} {goals.length === 1 ? 'goal' : 'goals'}</p></div></div>
        {goals.length ? <div className="goal-grid">{goals.map((goal) => <article className="card goal-card" key={goal.id}><div className="section-title"><span className="goal-period">{section.id} focus</span><div className="row-actions"><button className="icon-button" aria-label={`Edit ${goal.title}`} onClick={() => open(goal)}><Target size={14} /></button><button className="icon-button" aria-label={`Delete ${goal.title}`} onClick={() => remove(goal)}><Trash2 size={14} /></button></div></div><h3>{goal.title}</h3><div className="goal-target">Target {formatDate(goal.targetDate)} · {relativeDate(goal.targetDate)}</div><ProgressBar value={goal.progress} label={`${goal.title} progress`} /><label className="goal-footer"><span>Progress</span><span>{goal.progress}%</span><input className="range-input" type="range" min="0" max="100" step="5" aria-label={`${goal.title} progress`} value={goal.progress} onChange={(event) => updateProgress(goal, event.target.value)} style={{ gridColumn: '1 / -1' }} /></label></article>)}</div> : <div className="card"><EmptyState icon={Target} title={`No ${section.id} goals`} message="Choose one useful thing to work toward." action={<button className="button button-small" onClick={() => open(null, section.id)}>Add {section.id} goal</button>} /></div>}
      </section>
    })}
    {modalOpen && <Modal title={editing ? 'Edit goal' : 'Add goal'} onClose={() => setModalOpen(false)}><form onSubmit={save}>
      <div className="field"><label htmlFor="goal-title">Goal title</label><input id="goal-title" autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Complete two practice papers" /></div>
      <div className="form-grid"><div className="field"><label htmlFor="goal-period">Goal period</label><select id="goal-period" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="semester">Semester</option></select></div><div className="field"><label htmlFor="goal-date">Target date</label><input id="goal-date" type="date" value={form.targetDate} onChange={(event) => setForm({ ...form, targetDate: event.target.value })} /></div></div>
      <div className="field"><label htmlFor="goal-progress">Starting progress: {form.progress}%</label><input id="goal-progress" className="range-input" type="range" min="0" max="100" step="5" value={form.progress} onChange={(event) => setForm({ ...form, progress: event.target.value })} /></div>
      {error && <p className="form-error" role="alert">{error}</p>}<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button-primary" type="submit">{editing ? 'Save goal' : 'Add goal'}</button></div>
    </form></Modal>}
  </>
}
import { useMemo, useState } from 'react'
import { CheckSquare, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { daysBetween, formatDate, todayISO } from '../lib/dates'

const emptyForm = { title: '', subject: '', dueDate: todayISO(), priority: 'medium', status: 'todo' }
const tabs = [{ id: 'all', label: 'All' }, { id: 'todo', label: 'To do' }, { id: 'in-progress', label: 'In progress' }, { id: 'done', label: 'Done' }]
const statusLabels = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' }

export default function Assignments() {
  const { data, updateData } = useData()
  const { toast } = useToast()
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const today = todayISO()
  const counts = useMemo(() => Object.fromEntries(tabs.map((tab) => [tab.id, tab.id === 'all' ? data.assignments.length : data.assignments.filter((item) => item.status === tab.id).length])), [data.assignments])
  const visible = data.assignments.filter((item) => filter === 'all' || item.status === filter).sort((a, b) => (a.status === 'done') - (b.status === 'done') || a.dueDate.localeCompare(b.dueDate))
  const open = (item) => { setEditing(item?.id || null); setForm(item ? { title: item.title, subject: item.subject, dueDate: item.dueDate, priority: item.priority, status: item.status } : { ...emptyForm, subject: data.profile?.subjects?.[0]?.name || '' }); setError(''); setModalOpen(true) }
  const save = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.subject || !form.dueDate) { setError('Add a title, subject, and due date.'); return }
    const item = { ...form, title: form.title.trim(), id: editing || crypto.randomUUID() }
    try { await updateData((current) => ({ ...current, assignments: editing ? current.assignments.map((entry) => entry.id === editing ? item : entry) : [...current.assignments, item] })); setModalOpen(false); toast(editing ? 'Assignment updated.' : 'Assignment added.') }
    catch { setError('The assignment could not be saved. Please try again.') }
  }
  const changeStatus = async (item, status) => {
    try { await updateData((current) => ({ ...current, assignments: current.assignments.map((entry) => entry.id === item.id ? { ...entry, status } : entry) })); toast('Assignment status updated.') }
    catch { toast('The status could not be updated.', 'error') }
  }
  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    try { await updateData((current) => ({ ...current, assignments: current.assignments.filter((entry) => entry.id !== item.id) })); toast('Assignment deleted.') }
    catch { toast('The assignment could not be deleted.', 'error') }
  }
  return <>
    <PageHeader eyebrow="Keep deadlines in reach" title="Assignments" subtitle="Know what is due and what needs attention." action={<button className="button button-primary" onClick={() => open()}><Plus size={15} /> Add assignment</button>} />
    <section className="card card-pad"><div className="filter-row" role="tablist" aria-label="Filter assignments">{tabs.map((tab) => <button role="tab" aria-selected={filter === tab.id} className={`filter-button ${filter === tab.id ? 'selected' : ''}`} key={tab.id} onClick={() => setFilter(tab.id)}>{tab.label} <span>({counts[tab.id]})</span></button>)}</div>
      {visible.length ? <div className="table-list">{visible.map((item) => {
        const late = item.status !== 'done' && item.dueDate < today
        const dueToday = item.status !== 'done' && item.dueDate === today
        return <div className="list-row" key={item.id}><div><div className="list-title">{item.title}</div><div className="list-meta">{item.subject} · <span style={late ? { color: '#c3424e', fontWeight: 600 } : dueToday ? { color: '#ae692c', fontWeight: 600 } : undefined}>{late ? `Overdue · ${formatDate(item.dueDate)}` : dueToday ? 'Due today' : `Due ${formatDate(item.dueDate)}`}</span></div></div><span className={`badge ${item.priority === 'high' ? 'badge-red' : item.priority === 'medium' ? 'badge-orange' : ''}`}>{item.priority} priority</span><div className="row-actions"><select className="input" aria-label={`Status for ${item.title}`} value={item.status} onChange={(event) => changeStatus(item, event.target.value)} style={{ width: 118, minHeight: 34, padding: '5px 7px', fontSize: 10 }}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select><button className="icon-button" aria-label={`Edit ${item.title}`} onClick={() => open(item)}><CheckSquare size={14} /></button><button className="icon-button" aria-label={`Delete ${item.title}`} onClick={() => remove(item)}><Trash2 size={14} /></button></div></div>
      })}</div> : <EmptyState icon={CheckSquare} title={filter === 'all' ? 'No assignments yet' : `No ${statusLabels[filter].toLowerCase()} assignments`} message={filter === 'all' ? 'Add a deadline to keep your next steps visible.' : 'Assignments will appear here when their status matches.'} action={<button className="button button-small button-primary" onClick={() => open()}>Add assignment</button>} />}
    </section>
    {modalOpen && <Modal title={editing ? 'Edit assignment' : 'Add assignment'} onClose={() => setModalOpen(false)}><form onSubmit={save}>
      <div className="field"><label htmlFor="assignment-title">Assignment title</label><input id="assignment-title" autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Research paper" /></div>
      <div className="form-grid"><div className="field"><label htmlFor="assignment-subject">Subject</label><select id="assignment-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}><option value="">Choose a subject</option>{(data.profile?.subjects || []).map((subject) => <option key={subject.id} value={subject.name}>{subject.name}</option>)}</select></div><div className="field"><label htmlFor="assignment-date">Due date</label><input id="assignment-date" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></div><div className="field"><label htmlFor="priority">Priority</label><select id="priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><div className="field"><label htmlFor="status">Status</label><select id="status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></div></div>
      {error && <p className="form-error" role="alert">{error}</p>}<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button type="button" className="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button-primary" type="submit">{editing ? 'Save assignment' : 'Add assignment'}</button></div>
    </form></Modal>}
  </>
}
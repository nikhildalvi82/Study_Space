import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/PageHeader'

const newSubject = () => ({ id: crypto.randomUUID(), name: '', difficulty: 'medium', targetHours: 4 })

export default function Onboarding({ editing = false, onDone }) {
  const { data, updateData } = useData()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(() => data.profile || { name: '', course: '', dailyStudyHours: 4, wakeTime: '07:30', sleepTime: '22:30', subjects: [newSubject()], createdAt: new Date().toISOString() })
  const setField = (key, value) => setProfile((current) => ({ ...current, [key]: value }))
  const setSubject = (id, key, value) => setProfile((current) => ({ ...current, subjects: current.subjects.map((subject) => subject.id === id ? { ...subject, [key]: value } : subject) }))
  const validateStep = () => {
    if (step === 0 && (!profile.name.trim() || !profile.course.trim())) return 'Add your name and course to continue.'
    if (step === 1) {
      if (!profile.subjects.length || profile.subjects.some((subject) => !subject.name.trim())) return 'Add a name for each subject, or remove the empty row.'
      const names = profile.subjects.map((subject) => subject.name.trim().toLowerCase())
      if (new Set(names).size !== names.length) return 'Subject names need to be unique.'
      if (profile.subjects.some((subject) => Number(subject.targetHours) < 1 || Number(subject.targetHours) > 40)) return 'Subject targets must be between 1 and 40 hours.'
    }
    if (step === 2 && (Number(profile.dailyStudyHours) < 1 || Number(profile.dailyStudyHours) > 12)) return 'Daily study hours must be between 1 and 12.'
    return ''
  }
  const next = async () => {
    const message = validateStep()
    if (message) { setError(message); return }
    setError('')
    if (step < 2) { setStep((value) => value + 1); return }
    setSaving(true)
    try {
      await updateData((current) => ({ ...current, profile: { ...profile, name: profile.name.trim(), course: profile.course.trim(), dailyStudyHours: Number(profile.dailyStudyHours), subjects: profile.subjects.map((subject) => ({ ...subject, name: subject.name.trim(), targetHours: Number(subject.targetHours) })) } }))
      toast(editing ? 'Your details have been updated.' : 'Your study space is ready.')
      if (onDone) onDone(); else navigate('/')
    } catch { setError('Your details could not be saved. Please try again.') }
    finally { setSaving(false) }
  }
  return <div className="setup-screen"><div className="setup-wrap">
    <div className="eyebrow">{editing ? 'Your profile' : 'Set up your space'}</div><PageHeader title={editing ? 'Edit your details' : 'Let’s make a plan that fits.'} subtitle={`Step ${step + 1} of 3`} />
    <section className="card setup-card"><div className="setup-progress">{[0, 1, 2].map((item) => <span key={item} className={`setup-step ${item <= step ? 'active' : ''}`} />)}</div>
      {step === 0 && <><h2 style={{ marginBottom: 17 }}>A little about you</h2><div className="field"><label htmlFor="student-name">Your name</label><input id="student-name" value={profile.name} onChange={(event) => setField('name', event.target.value)} placeholder="Alex Morgan" autoComplete="name" /></div><div className="field"><label htmlFor="course">Course or program</label><input id="course" value={profile.course} onChange={(event) => setField('course', event.target.value)} placeholder="Biology, Year 2" /></div></>}
      {step === 1 && <><div className="section-title"><div><h2>Your subjects</h2><p className="muted small" style={{ margin: '5px 0 0' }}>Set a focus target for each one.</p></div><button className="button button-small" onClick={() => setProfile((current) => ({ ...current, subjects: [...current.subjects, newSubject()] }))}><Plus size={14} /> Add subject</button></div>
        {profile.subjects.map((subject) => <div className="subject-edit-row" key={subject.id}><input aria-label="Subject name" placeholder="Subject name" value={subject.name} onChange={(event) => setSubject(subject.id, 'name', event.target.value)} /><select aria-label="Difficulty" value={subject.difficulty} onChange={(event) => setSubject(subject.id, 'difficulty', event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><input aria-label="Target hours per week" type="number" min="1" max="40" value={subject.targetHours} onChange={(event) => setSubject(subject.id, 'targetHours', event.target.value)} /><button className="icon-button" aria-label={`Remove ${subject.name || 'subject'}`} onClick={() => setProfile((current) => ({ ...current, subjects: current.subjects.filter((item) => item.id !== subject.id) }))}><Trash2 size={15} /></button></div>)}
        {profile.subjects.length === 0 && <p className="muted small">Add at least one subject to build a study timetable.</p>}</>}
      {step === 2 && <><h2 style={{ marginBottom: 17 }}>Your daily rhythm</h2><div className="field"><label htmlFor="hours">Daily study hours</label><input id="hours" type="number" min="1" max="12" value={profile.dailyStudyHours} onChange={(event) => setField('dailyStudyHours', event.target.value)} /><span className="muted small">Choose between 1 and 12 hours.</span></div><div className="form-grid"><div className="field"><label htmlFor="wake">Wake-up time</label><input id="wake" type="time" value={profile.wakeTime} onChange={(event) => setField('wakeTime', event.target.value)} /></div><div className="field"><label htmlFor="sleep">Bedtime</label><input id="sleep" type="time" value={profile.sleepTime} onChange={(event) => setField('sleepTime', event.target.value)} /></div></div></>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}><button className="button" disabled={step === 0 || saving} onClick={() => { setError(''); setStep((value) => value - 1) }}>Back</button><button className="button button-primary" disabled={saving} onClick={next}>{saving ? 'Saving…' : step === 2 ? editing ? 'Save details' : 'Finish setup' : 'Continue'}</button></div>
    </section>
  </div></div>
}
import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { todayISO } from '../lib/dates'

const presets = [{ label: '25 / 5', focus: 25, rest: 5 }, { label: '50 / 10', focus: 50, rest: 10 }]

export default function Pomodoro() {
  const { data, updateData } = useData()
  const { toast } = useToast()
  const [preset, setPreset] = useState(presets[0])
  const [mode, setMode] = useState('focus')
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(presets[0].focus * 60)
  const [subject, setSubject] = useState('')
  const [assignment, setAssignment] = useState('')
  const startedAt = useRef(null)
  const logged = useRef(false)
  const totalSeconds = (mode === 'focus' ? preset.focus : preset.rest) * 60

  useEffect(() => {
    if (!running) return undefined
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000)
      const nextRemaining = Math.max(0, totalSeconds - elapsed)
      setRemaining(nextRemaining)
      if (nextRemaining === 0) {
        setRunning(false)
        if (mode === 'focus' && !logged.current) {
          logged.current = true
          const minutes = Math.max(1, Math.round(elapsed / 60))
          const task = data.assignments.find((item) => item.id === assignment)
          updateData((current) => ({ ...current, sessions: [...current.sessions, { id: `timer-${Date.now()}`, date: todayISO(), minutes, subject: subject || task?.subject || '', source: task ? `assignment:${task.id}` : 'focus-timer', createdAt: new Date().toISOString() }] }))
            .then(() => toast('Focus session logged.')).catch(() => toast('The focus session could not be saved.', 'error'))
        }
        if ('Notification' in window && Notification.permission === 'granted') new Notification(mode === 'focus' ? 'Focus session complete' : 'Break complete', { body: mode === 'focus' ? 'Time for a short break.' : 'Ready for another focus session?' })
        if (mode === 'focus') { setMode('break'); setRemaining(preset.rest * 60) }
        else { setMode('focus'); setRemaining(preset.focus * 60) }
      }
    }
    tick()
    const interval = window.setInterval(tick, 500)
    return () => window.clearInterval(interval)
  }, [running, totalSeconds, mode, data.assignments, assignment, subject, preset, updateData, toast])

  const start = () => {
    if (remaining <= 0) setRemaining(totalSeconds)
    startedAt.current = Date.now() - (totalSeconds - remaining) * 1000
    logged.current = false
    setRunning(true)
  }
  const pause = () => {
    setRemaining(Math.max(0, totalSeconds - Math.floor((Date.now() - startedAt.current) / 1000)))
    setRunning(false)
  }
  const stop = async () => {
    const elapsed = running ? Math.max(0, Math.floor((Date.now() - startedAt.current) / 1000)) : totalSeconds - remaining
    setRunning(false)
    if (mode === 'focus' && elapsed >= 60 && !logged.current) {
      logged.current = true
      const minutes = Math.max(1, Math.round(elapsed / 60))
      const task = data.assignments.find((item) => item.id === assignment)
      try {
        await updateData((current) => ({ ...current, sessions: [...current.sessions, { id: `timer-${Date.now()}`, date: todayISO(), minutes, subject: subject || task?.subject || '', source: task ? `assignment:${task.id}` : 'focus-timer', createdAt: new Date().toISOString() }] }))
        toast(`${minutes} focus minutes logged.`)
      } catch { toast('Focus minutes could not be saved.', 'error') }
    }
    setRemaining(totalSeconds)
  }
  const selectPreset = (next) => { if (!running) { setPreset(next); setMode('focus'); setRemaining(next.focus * 60) } }
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  return <div className="focus-panel">
    <div className="focus-presets">{presets.map((item) => <button className={preset.label === item.label ? 'selected' : ''} key={item.label} onClick={() => selectPreset(item)} disabled={running}>{item.label} min</button>)}</div>
    <div className="muted small" style={{ textAlign: 'center' }}>{mode === 'focus' ? 'Focus time' : 'Take a break'}</div>
    <div className="focus-time" aria-live="off">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</div>
    {!running && mode === 'focus' && <div className="form-grid" style={{ marginBottom: 11 }}>
      <select className="input" aria-label="Link timer to a subject" value={subject} onChange={(event) => { setSubject(event.target.value); if (event.target.value) setAssignment('') }}><option value="">No subject</option>{(data.profile?.subjects || []).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select>
      <select className="input" aria-label="Link timer to an assignment" value={assignment} onChange={(event) => { setAssignment(event.target.value); if (event.target.value) setSubject('') }}><option value="">No assignment</option>{data.assignments.filter((item) => item.status !== 'done').map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
    </div>}
    <div className="focus-actions">{running ? <button className="button button-primary" onClick={pause}><Pause size={15} /> Pause</button> : <button className="button button-primary" onClick={start}><Play size={15} /> {remaining < totalSeconds ? 'Resume' : 'Start focus'}</button>}{remaining < totalSeconds || running ? <button className="button" onClick={stop}><RotateCcw size={15} /> Stop</button> : <button className="button button-quiet" onClick={() => { setRemaining(totalSeconds); setMode('focus') }} aria-label="Reset timer"><RotateCcw size={15} /></button>}</div>
  </div>
}
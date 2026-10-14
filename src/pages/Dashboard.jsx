import { useMemo } from 'react'
import { BookOpen, Flame, Hourglass, Plus, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import BlockRow from '../components/BlockRow'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import WeeklyChart from '../components/WeeklyChart'
import Pomodoro from '../components/Pomodoro'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { buildDay, computeStats } from '../lib/scheduler'
import { addDays, daysBetween, formatDate, formatMinutes, todayISO } from '../lib/dates'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, updateData } = useData()
  const { toast } = useToast()
  const today = todayISO()
  const plan = useMemo(() => buildDay(data, today), [data, today])
  const stats = useMemo(() => computeStats(data), [data])
  const blocks = plan.filter((item) => item.type === 'study')
  const completed = blocks.filter((block) => data.sessions.some((session) => session.source === `plan:${today}:${block.id}`)).length
  const upcoming = [
    ...data.exams.filter((exam) => exam.date >= today).map((item) => ({ ...item, title: item.name, date: item.date, kind: 'Exam' })),
    ...data.assignments.filter((item) => item.status !== 'done' && item.dueDate >= today).map((item) => ({ ...item, title: item.title, date: item.dueDate, kind: 'Assignment' })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5)
  const toggleBlock = async (block) => {
    const source = `plan:${today}:${block.id}`
    const existing = data.sessions.find((session) => session.source === source)
    try {
      await updateData((current) => ({ ...current, sessions: existing ? current.sessions.filter((session) => session.source !== source) : [...current.sessions, { id: source, date: today, minutes: block.minutes, subject: block.subject, source, createdAt: new Date().toISOString() }] }))
    } catch { toast('Your progress could not be saved.', 'error') }
  }
  return <>
    <PageHeader eyebrow="Your workspace" title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${(data.profile?.name || user?.displayName || 'there').split(' ')[0]}.`} subtitle="A clear plan makes it easier to get started." action={<Link className="button button-primary" to="/schedule"><Plus size={15} /> View schedule</Link>} />
    <section className="card card-pad"><div className="section-title"><div><h2>Today’s plan</h2><div className="muted small" style={{ marginTop: 5 }}>{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</div></div><span className="badge badge-blue">{completed} of {blocks.length} blocks done</span></div>
      <ProgressBar value={blocks.length ? completed / blocks.length * 100 : 0} label="Today's planned study progress" />
      {plan.length ? <div className="timeline" style={{ marginTop: 12 }}>{plan.map((block) => <BlockRow key={block.id} block={block} checked={data.sessions.some((session) => session.source === `plan:${today}:${block.id}`)} onToggle={() => toggleBlock(block)} />)}</div> : <EmptyState title="No plan yet" message="Add subjects and daily hours to build a timetable." action={<Link className="button button-small" to="/profile">Set up your profile</Link>} />}
      {!blocks.length && data.profile?.subjects?.length > 0 && <p className="muted small" style={{ margin: '12px 0 0' }}>Your routine is set. Adjust your daily hours or wake and sleep times if you want study blocks here.</p>}
    </section>
    <section className="stat-grid" style={{ marginTop: 16 }}>
      <StatCard icon={Hourglass} label="Hours studied" value={`${stats.todayHours.toFixed(1)}h`} caption={`${stats.weekHours.toFixed(1)} hours this week`} />
      <StatCard icon={BookOpen} label="Tasks completed" value={stats.tasksCompleted} caption="Assignments and exam topics" tint="#16a085" />
      <StatCard icon={Flame} label="Study streak" value={`${stats.studyStreak} ${stats.studyStreak === 1 ? 'day' : 'days'}`} caption="Keep showing up" tint="#e58c51" />
      <StatCard icon={Target} label="Goal progress" value={`${stats.goalCompletion}%`} caption="Average across your goals" tint="#b45ba6" />
    </section>
    <section className="dashboard-grid">
      <article className="card card-pad"><div className="section-title"><div><h2>Coming up</h2><p className="muted small" style={{ margin: '5px 0 0' }}>Your next exams and deadlines</p></div><Link className="button button-small" to="/exams">View all</Link></div>
        {upcoming.length ? <div className="upcoming-list">{upcoming.map((item) => <div className="upcoming-item" key={`${item.kind}-${item.id}`}><div className="date-box"><strong>{new Date(`${item.date}T12:00:00`).getDate()}</strong><span>{formatDate(item.date, { month: 'short' })}</span></div><div style={{ minWidth: 0, flex: 1 }}><div className="list-title">{item.title}</div><div className="list-meta">{item.kind} · {daysBetween(today, item.date) === 0 ? 'Today' : daysBetween(today, item.date) === 1 ? 'Tomorrow' : `In ${daysBetween(today, item.date)} days`}</div></div><span className={`badge ${item.kind === 'Exam' ? 'badge-orange' : 'badge-green'}`}>{item.kind}</span></div>)}</div> : <EmptyState title="Nothing coming up" message="Add an exam or assignment to keep it in view." action={<Link className="button button-small" to="/assignments">Add a task</Link>} />}
      </article>
      <article className="card card-pad"><div className="section-title"><div><h2>Focus timer</h2><p className="muted small" style={{ margin: '5px 0 0' }}>A little focused time adds up.</p></div></div><Pomodoro /></article>
    </section>
    <section className="lower-grid">
      <article className="card card-pad"><div className="section-title"><div><h2>Study hours</h2><p className="muted small" style={{ margin: '5px 0 0' }}>Your last seven days</p></div><span className="badge">{formatMinutes(Math.round(stats.last7DaysHours * 60))}</span></div><WeeklyChart data={stats.last7Days} /></article>
      <article className="card card-pad"><div className="section-title"><div><h2>Subject progress</h2><p className="muted small" style={{ margin: '5px 0 0' }}>Against your weekly targets</p></div></div>
        {stats.subjectProgress.length ? stats.subjectProgress.map((subject) => <div className="subject-row" key={subject.id}><span className="subject-name">{subject.name}</span><ProgressBar value={subject.progress} label={`${subject.name} progress`} /><span className="subject-progress-text">{subject.progress}%</span></div>) : <EmptyState title="No subjects added" message="Add your subjects to see progress here." action={<Link className="button button-small" to="/profile">Add subjects</Link>} />}
      </article>
    </section>
  </>
}
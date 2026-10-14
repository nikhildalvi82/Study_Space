import { useNavigate } from 'react-router-dom'
import { BookOpen, CalendarDays, Clock3, Flame, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import WeeklyChart from '../components/WeeklyChart'
import ProgressBar from '../components/ProgressBar'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { computeStats } from '../lib/scheduler'
import { formatDate, formatMinutes } from '../lib/dates'

export default function Profile() {
  const { user } = useAuth()
  const { data } = useData()
  const navigate = useNavigate()
  const profile = data.profile
  const stats = computeStats(data)
  const initials = profile.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const createdAt = profile.createdAt ? new Date(profile.createdAt) : new Date()
  const durationDays = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / 86400000))
  const durationLabel = durationDays < 30 ? `${durationDays} ${durationDays === 1 ? 'day' : 'days'}` : `${Math.floor(durationDays / 30)} ${Math.floor(durationDays / 30) === 1 ? 'month' : 'months'}`
  const recentSessions = [...data.sessions].sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date)).slice(0, 6)
  return <>
    <PageHeader eyebrow="Your study space" title="Profile" subtitle="Your routine and progress, all in one view." action={<button className="button" onClick={() => navigate('/setup?edit=1')}><Pencil size={14} /> Edit details</button>} />
    <section className="card card-pad" style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}><div className="avatar" style={{ width: 64, height: 64, fontSize: 20 }}>{initials}</div><div style={{ flex: 1 }}><h2 style={{ fontSize: 18, marginBottom: 5 }}>{profile.name}</h2><div className="muted small">{profile.course} · {user?.email}</div><div className="muted small" style={{ marginTop: 5 }}>Studying with Study Space for {durationLabel}</div></div><span className="badge badge-blue">{profile.dailyStudyHours}h daily goal</span></section>
    <section className="stat-grid" style={{ marginBottom: 16 }}><StatCard icon={Clock3} label="Total study time" value={`${stats.totalHours.toFixed(1)}h`} caption={`${stats.weekHours.toFixed(1)} hours this week`} /><StatCard icon={BookOpen} label="Tasks completed" value={stats.tasksCompleted} caption="Assignments and exam topics" tint="#16a085" /><StatCard icon={Flame} label="Study streak" value={`${stats.studyStreak} days`} caption="Consecutive study days" tint="#e58c51" /><StatCard icon={CalendarDays} label="Study sessions" value={data.sessions.length} caption="Logged focus sessions" tint="#b45ba6" /></section>
    <section className="lower-grid"><article className="card card-pad"><div className="section-title"><div><h2>Weekly study hours</h2><p className="muted small" style={{ margin: '5px 0 0' }}>Hours logged per day</p></div></div><WeeklyChart data={stats.last7Days} /></article><article className="card card-pad"><div className="section-title"><div><h2>Subject progress</h2><p className="muted small" style={{ margin: '5px 0 0' }}>Compared with weekly targets</p></div></div>{stats.subjectProgress.length ? stats.subjectProgress.map((subject) => <div className="subject-row" key={subject.id}><span className="subject-name">{subject.name}</span><ProgressBar value={subject.progress} label={`${subject.name} progress`} /><span className="subject-progress-text">{formatMinutes(subject.minutes)}</span></div>) : <EmptyState title="No subjects yet" message="Add subjects to track time by class." />}</article></section>
    <section className="dashboard-grid"><article className="card card-pad"><div className="section-title"><h2>Daily routine</h2><button className="button button-small" onClick={() => navigate('/setup?edit=1')}>Edit routine</button></div><div className="list-row"><div className="list-title">Wake-up time</div><div className="muted small">{profile.wakeTime}</div></div><div className="list-row"><div className="list-title">Bedtime</div><div className="muted small">{profile.sleepTime}</div></div><div className="list-row"><div className="list-title">Daily study target</div><div className="muted small">{profile.dailyStudyHours} hours</div></div></article><article className="card card-pad"><div className="section-title"><h2>Recent study sessions</h2></div>{recentSessions.length ? recentSessions.map((session) => <div className="list-row" key={session.id}><div><div className="list-title">{session.subject || 'Focus session'}</div><div className="list-meta">{formatDate(session.date, { weekday: 'short', month: 'short', day: 'numeric' })}</div></div><span className="badge">{formatMinutes(session.minutes)}</span></div>) : <EmptyState title="No sessions logged" message="Tick a planned study block or use the focus timer to get started." />}</article></section>
  </>
}
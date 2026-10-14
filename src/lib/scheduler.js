import { addDays, daysBetween, todayISO } from './dates'

const clockMinutes = (time = '08:00') => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const atClock = (time, start, end) => {
  let point = clockMinutes(time)
  while (point < start) point += 1440
  return point <= end ? point : null
}

const labelTime = (minute) => {
  const normalized = ((minute % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  return `${hours % 12 || 12}:${String(mins).padStart(2, '0')} ${suffix}`
}

export function revisionPlan(exam, fromDate = todayISO()) {
  const remaining = (exam?.topics || []).filter((topic) => !topic.done)
  const daysLeft = Math.max(1, daysBetween(fromDate, exam?.date || fromDate) + 1)
  if (!remaining.length) return []
  const plan = Array.from({ length: daysLeft }, (_, index) => ({ date: addDays(fromDate, index), topics: [] }))
  remaining.forEach((topic, index) => plan[Math.floor(index * daysLeft / remaining.length)].topics.push(topic.name))
  return plan.filter((day) => day.topics.length)
}

function pickSubject(data, isoDate, blockIndex, excluded = new Set()) {
  const subjects = data.profile?.subjects || []
  if (!subjects.length) return null
  const weighted = subjects.map((subject) => {
    const difficulty = { easy: 1, medium: 2, hard: 3 }[subject.difficulty] || 1
    const examUrgency = (data.exams || []).filter((exam) => exam.subject === subject.name && daysBetween(isoDate, exam.date) >= 0 && daysBetween(isoDate, exam.date) <= 45)
      .reduce((sum, exam) => sum + 10 / (daysBetween(isoDate, exam.date) + 2), 0)
    const assignmentUrgency = (data.assignments || []).filter((item) => item.subject === subject.name && item.status !== 'done')
      .reduce((sum, item) => sum + 4 / (Math.max(0, daysBetween(isoDate, item.dueDate)) + 2), 0)
    return { subject, weight: difficulty + examUrgency + assignmentUrgency }
  })
  const available = weighted.filter(({ subject }) => !excluded.has(subject.name))
  const pool = available.length ? available : weighted
  const total = pool.reduce((sum, item) => sum + item.weight, 0)
  let seed = (blockIndex + isoDate.split('-').join('')) % 997 / 997 * total
  for (const item of pool) {
    seed -= item.weight
    if (seed <= 0) return item.subject
  }
  return pool[pool.length - 1].subject
}

function titleFor(data, subject, isoDate, blockIndex) {
  const exams = (data.exams || []).filter((exam) => exam.subject === subject.name && daysBetween(isoDate, exam.date) >= 0 && daysBetween(isoDate, exam.date) <= 30)
  const revision = exams.flatMap((exam) => revisionPlan(exam, isoDate).filter((day) => day.date === isoDate).flatMap((day) => day.topics.map((topic) => ({ exam, topic }))))
  if (revision.length) return `Revise: ${revision[blockIndex % revision.length].topic}`
  const assignment = (data.assignments || []).filter((item) => item.subject === subject.name && item.status !== 'done' && daysBetween(isoDate, item.dueDate) >= 0 && daysBetween(isoDate, item.dueDate) <= 14)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  return assignment ? `Work on: ${assignment.title}` : `Study ${subject.name}`
}

export function buildDay(data, isoDate) {
  const start = clockMinutes(data.profile?.wakeTime || '07:30')
  let finish = clockMinutes(data.profile?.sleepTime || '22:30')
  if (finish <= start) finish += 1440
  const events = []
  const addFixed = (id, title, time, duration, type) => {
    const minute = atClock(time, start, finish)
    if (minute !== null && minute + duration <= finish) events.push({ id, title, start: minute, end: minute + duration, type })
  }
  events.push({ id: 'wake', title: 'Wake up', start, end: Math.min(start + 15, finish), type: 'routine' })
  addFixed('breakfast', 'Breakfast', `${String(Math.floor(((start % 1440) + 60) % 1440 / 60)).padStart(2, '0')}:${String((start + 60) % 60).padStart(2, '0')}`, 35, 'meal')
  addFixed('lunch', 'Lunch', '12:30', 45, 'meal')
  addFixed('dinner', 'Dinner', '18:30', 45, 'meal')
  events.push({ id: 'wind-down', title: 'Wind down', start: Math.max(start, finish - 30), end: finish, type: 'routine' })
  const fixed = events.slice().sort((a, b) => a.start - b.start)
  const windows = []
  let cursor = start + 15
  for (const event of fixed) {
    if (event.start - cursor >= 15) windows.push({ start: cursor, end: event.start })
    cursor = Math.max(cursor, event.end)
  }
  if (finish - cursor >= 15) windows.push({ start: cursor, end: finish })

  const totalWindow = windows.reduce((sum, window) => sum + window.end - window.start, 0)
  const budget = Math.min((data.profile?.dailyStudyHours || 0) * 60, totalWindow)
  let assigned = 0
  let blockIndex = 0
  windows.forEach((window, windowIndex) => {
    const proportional = windowIndex === windows.length - 1
      ? budget - assigned
      : Math.floor(budget * (window.end - window.start) / (totalWindow || 1))
    assigned += proportional
    let remaining = Math.max(0, proportional)
    let position = window.start
    while (remaining >= 20 && position < window.end) {
      const studyLength = Math.min(50, remaining, window.end - position)
      if (studyLength < 20) break
      const subject = pickSubject(data, isoDate, blockIndex)
      if (!subject) break
      const id = `study-${isoDate}-${blockIndex}`
      events.push({
        id, title: titleFor(data, subject, isoDate, blockIndex), subject: subject.name,
        start: position, end: position + studyLength, minutes: studyLength, type: 'study',
      })
      position += studyLength
      remaining -= studyLength
      blockIndex += 1
      if (remaining > 0 && position + 10 <= window.end) {
        const breakLength = blockIndex % 3 === 0 ? 30 : 10
        const actualBreak = Math.min(breakLength, window.end - position)
        if (actualBreak >= 10) {
          events.push({ id: `break-${isoDate}-${blockIndex}`, title: 'Take a break', start: position, end: position + actualBreak, type: 'break' })
          position += actualBreak
        }
      }
    }
  })

  const sorted = events.sort((a, b) => a.start - b.start)
  const timeline = []
  let previous = start
  let gapIndex = 0
  for (const event of sorted) {
    if (event.start - previous >= 15) timeline.push({ id: `free-${isoDate}-${gapIndex++}`, title: 'Free time', start: previous, end: event.start, type: 'free' })
    timeline.push({ ...event, startLabel: labelTime(event.start), endLabel: labelTime(event.end) })
    previous = Math.max(previous, event.end)
  }
  if (finish - previous >= 15) timeline.push({ id: `free-${isoDate}-end`, title: 'Free time', start: previous, end: finish, type: 'free', startLabel: labelTime(previous), endLabel: labelTime(finish) })
  return timeline.map((event) => ({ ...event, startLabel: event.startLabel || labelTime(event.start), endLabel: event.endLabel || labelTime(event.end) }))
}

export function computeStats(data) {
  const sessions = data.sessions || []
  const today = todayISO()
  const weekStart = addDays(today, -new Date().getDay())
  const lastWeek = addDays(today, -6)
  const todaySessions = sessions.filter((session) => session.date === today)
  const weekMinutes = sessions.filter((session) => session.date >= weekStart && session.date <= today).reduce((sum, session) => sum + session.minutes, 0)
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6)
    return { date, label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T12:00:00`)), hours: sessions.filter((session) => session.date === date).reduce((sum, session) => sum + session.minutes, 0) / 60 }
  })
  const completedTasks = (data.assignments || []).filter((item) => item.status === 'done').length + (data.exams || []).reduce((sum, exam) => sum + exam.topics.filter((topic) => topic.done).length, 0)
  const goalCompletion = data.goals?.length ? Math.round(data.goals.reduce((sum, goal) => sum + goal.progress, 0) / data.goals.length) : 0
  const studiedDates = new Set(sessions.map((session) => session.date))
  let streak = 0
  let cursor = studiedDates.has(today) ? today : addDays(today, -1)
  while (studiedDates.has(cursor)) { streak += 1; cursor = addDays(cursor, -1) }
  const subjectProgress = (data.profile?.subjects || []).map((subject) => {
    const minutes = sessions.filter((session) => session.subject === subject.name && session.date >= weekStart && session.date <= today).reduce((sum, session) => sum + session.minutes, 0)
    const target = (subject.targetHours || 1) * 60
    return { ...subject, minutes, progress: Math.min(100, Math.round(minutes / target * 100)) }
  })
  return {
    totalHours: sessions.reduce((sum, session) => sum + session.minutes, 0) / 60,
    weekHours: weekMinutes / 60,
    tasksCompleted: completedTasks,
    goalCompletion,
    last7Days,
    studyStreak: streak,
    subjectProgress,
    todayHours: todaySessions.reduce((sum, session) => sum + session.minutes, 0) / 60,
    last7DaysHours: sessions.filter((session) => session.date >= lastWeek && session.date <= today).reduce((sum, session) => sum + session.minutes, 0) / 60,
  }
}
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useData } from './context/DataContext'
import Layout from './components/Layout'
const Login = lazy(() => import('./pages/Login'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Schedule = lazy(() => import('./pages/Schedule'))
const Exams = lazy(() => import('./pages/Exams'))
const Assignments = lazy(() => import('./pages/Assignments'))
const Goals = lazy(() => import('./pages/Goals'))
const Profile = lazy(() => import('./pages/Profile'))

function Loading() { return <div className="loading-screen"><div><div className="spinner" />Loading your study space</div></div> }

function AuthGate({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { data, ready } = useData()
  const location = useLocation()
  if (authLoading || (user && !ready)) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!data.profile && location.pathname !== '/setup') return <Navigate to="/setup" replace />
  return children
}

function SetupGate() {
  const { user, loading: authLoading } = useAuth()
  const { data, ready } = useData()
  const location = useLocation()
  const editing = new URLSearchParams(location.search).has('edit')
  if (authLoading || (user && !ready)) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (data.profile && !editing) return <Navigate to="/" replace />
  return <Onboarding editing={editing} />
}

export default function App() {
  return <Suspense fallback={<Loading />}><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/setup" element={<SetupGate />} />
    <Route element={<AuthGate><Layout /></AuthGate>}>
      <Route index element={<Dashboard />} />
      <Route path="schedule" element={<Schedule />} />
      <Route path="exams" element={<Exams />} />
      <Route path="assignments" element={<Assignments />} />
      <Route path="goals" element={<Goals />} />
      <Route path="profile" element={<Profile />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense>
}
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../firebase'

const friendlyError = (error) => {
  const code = error?.code || ''
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'That email and password do not match. Check them and try again.'
  if (code.includes('email-already-in-use')) return 'An account with this email already exists. Try signing in instead.'
  if (code.includes('weak-password')) return 'Choose a stronger password with at least 6 characters.'
  if (code.includes('popup-closed')) return 'The Google sign-in window was closed before finishing.'
  if (code.includes('network-request-failed')) return 'We could not connect. Check your internet and try again.'
  if (code.includes('invalid-email')) return 'Enter a valid email address.'
  return 'We could not sign you in right now. Please try again.'
}

export default function Login() {
  const { signIn, createAccount, signInWithGoogle, user, loading, demoMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [createMode, setCreateMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user && !loading) return <Navigate to="/" replace />
  const complete = () => navigate(location.state?.from?.pathname || '/', { replace: true })
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true)
    try { await (createMode ? createAccount(email.trim(), password) : signIn(email.trim(), password)); complete() }
    catch (nextError) { setError(friendlyError(nextError)) }
    finally { setBusy(false) }
  }
  const google = async () => { setError(''); setBusy(true); try { await signInWithGoogle(); complete() } catch (nextError) { setError(friendlyError(nextError)) } finally { setBusy(false) } }
  return <div className="login-screen">
    <aside className="login-aside"><div className="brand"><span className="brand-mark"><Lightbulb size={19} /></span><span>Study Space</span></div><div className="login-copy"><div className="eyebrow" style={{ color: '#b6bee3' }}>A little more clarity, every day</div><h1>Make room for what matters.</h1><p>Bring your study plan, deadlines, and progress into one calm, practical space.</p></div><div className="login-aside-foot">A steady plan beats a perfect plan.</div></aside>
    <main className="login-main"><form className="login-form" onSubmit={submit}>
      <h2>{createMode ? 'Create your account' : 'Welcome back'}</h2><p className="login-subtitle">{createMode ? 'Start building a study routine that works for you.' : 'Sign in to pick up where you left off.'}</p>
      {demoMode && <div className="demo-notice" role="note">Demo mode is on. Use any email and password to continue. Your data stays in this browser.</div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={createMode ? 'new-password' : 'current-password'} minLength={isFirebaseConfigured && createMode ? 6 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div>
      <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : createMode ? 'Create account' : 'Sign in'}</button>
      <div className="divider">or</div><button className="button" type="button" disabled={busy} onClick={google}>Continue with Google</button>
      <div className="login-switch">{createMode ? 'Already have an account?' : 'New to Study Space?'}<button className="text-button" type="button" onClick={() => { setCreateMode((value) => !value); setError('') }}>{createMode ? 'Sign in' : 'Create account'}</button></div>
    </form></main>
  </div>
}
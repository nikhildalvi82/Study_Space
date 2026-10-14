import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'

const AuthContext = createContext(null)
const DEMO_USER_KEY = 'study-space-demo-user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      try { setUser(JSON.parse(localStorage.getItem(DEMO_USER_KEY) || 'null')) } catch { setUser(null) }
      setLoading(false)
      return undefined
    }
    return onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setLoading(false) })
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    demoMode: !isFirebaseConfigured,
    async signIn(email, password) {
      if (isFirebaseConfigured) return signInWithEmailAndPassword(auth, email, password)
      const nextUser = { uid: `demo-${email.toLowerCase()}`, email, displayName: email.split('@')[0] }
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(nextUser)); setUser(nextUser)
      return nextUser
    },
    async createAccount(email, password) {
      if (isFirebaseConfigured) return createUserWithEmailAndPassword(auth, email, password)
      const nextUser = { uid: `demo-${email.toLowerCase()}`, email, displayName: email.split('@')[0] }
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(nextUser)); setUser(nextUser)
      return nextUser
    },
    async signInWithGoogle() {
      if (isFirebaseConfigured) return signInWithPopup(auth, new GoogleAuthProvider())
      const nextUser = { uid: 'demo-student@example.com', email: 'student@example.com', displayName: 'Demo student' }
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(nextUser)); setUser(nextUser)
      return nextUser
    },
    async signOut() {
      if (isFirebaseConfigured) await signOut(auth)
      else localStorage.removeItem(DEMO_USER_KEY)
      setUser(null)
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
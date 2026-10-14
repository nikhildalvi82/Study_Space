import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)
const emptyData = { profile: null, exams: [], assignments: [], goals: [], sessions: [] }
const localKey = (uid) => `study-space-data-${uid}`

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [loadedUid, setLoadedUid] = useState(null)

  useEffect(() => {
    let active = true
    if (!user) { setData(emptyData); setLoadedUid(null); setLoading(false); return () => { active = false } }
    setLoading(true)
    setLoadedUid(null)
    const load = async () => {
      try {
        if (isFirebaseConfigured) {
          const snapshot = await getDoc(doc(db, 'users', user.uid))
          if (active) setData(snapshot.exists() ? { ...emptyData, ...snapshot.data() } : emptyData)
        } else {
          const stored = localStorage.getItem(localKey(user.uid))
          if (active) setData(stored ? { ...emptyData, ...JSON.parse(stored) } : emptyData)
        }
      } catch (error) {
        console.error('Unable to load student data', error)
        if (active) setData(emptyData)
      } finally { if (active) { setLoadedUid(user.uid); setLoading(false) } }
    }
    load()
    return () => { active = false }
  }, [user])

  const updateData = useCallback(async (change) => {
    if (!user) throw new Error('Sign in before saving your study data.')
    const next = typeof change === 'function' ? change(data) : { ...data, ...change }
    const normalized = { ...emptyData, ...next }
    setData(normalized)
    try {
      if (isFirebaseConfigured) await setDoc(doc(db, 'users', user.uid), normalized)
      else localStorage.setItem(localKey(user.uid), JSON.stringify(normalized))
    } catch (error) {
      setData(data)
      throw error
    }
    return normalized
  }, [data, user])

  const value = useMemo(() => ({ data, loading, ready: !user ? !loading : loadedUid === user.uid && !loading, updateData }), [data, loading, loadedUid, updateData, user])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CircleCheck, CircleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const dismiss = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), [])
  const toast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setItems((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismiss(id), 3500)
  }, [dismiss])
  const value = useMemo(() => ({ toast }), [toast])
  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-stack" aria-live="polite">{items.map((item) => <div className="toast" key={item.id} role="status">
      {item.type === 'error' ? <CircleAlert size={18} /> : <CircleCheck size={18} />}<span>{item.message}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}><X size={15} /></button>
    </div>)}</div>
  </ToastContext.Provider>
}

export const useToast = () => useContext(ToastContext)
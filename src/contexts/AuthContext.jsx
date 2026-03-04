import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [studio, setStudio] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStudio = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('studios')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      return data || null
    } catch (err) {
      console.error('Fetch studio error:', err)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let initializing = true

    // Init: carica sessione esistente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const studioData = await fetchStudio(currentUser.id)
        if (mounted) setStudio(studioData)
      }

      if (mounted) {
        setLoading(false)
        initializing = false
      }
    }).catch(() => {
      if (mounted) setLoading(false)
      initializing = false
    })

    // Listener per cambiamenti auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        // Ignora durante init per evitare doppia chiamata
        if (initializing) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const studioData = await fetchStudio(currentUser.id)
          if (mounted) setStudio(studioData)
        } else {
          setStudio(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchStudio])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Aggiorna subito user e studio senza aspettare il listener
    setUser(data.user)
    const studioData = await fetchStudio(data.user.id)
    setStudio(studioData)
    return data
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setStudio(null)
  }

  async function refreshStudio() {
    if (!user) return
    const studioData = await fetchStudio(user.id)
    setStudio(studioData)
  }

  const value = { user, studio, loading, signIn, signUp, signOut, refreshStudio }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

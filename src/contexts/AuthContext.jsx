import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [studio, setStudio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          const { data } = await supabase
            .from('studios')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (mounted) setStudio(data || null)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          try {
            const { data } = await supabase
              .from('studios')
              .select('*')
              .eq('user_id', currentUser.id)
              .maybeSingle()

            if (mounted) setStudio(data || null)
          } catch (err) {
            console.error('Fetch studio error:', err)
          }
        } else {
          setStudio(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
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
  }

  async function refreshStudio() {
    if (!user) return
    try {
      const { data } = await supabase
        .from('studios')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      setStudio(data || null)
    } catch (err) {
      console.error('Refresh studio error:', err)
    }
  }

  const value = { user, studio, loading, signIn, signUp, signOut, refreshStudio }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

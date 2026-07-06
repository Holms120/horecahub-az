import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  async function fetchProfile(userId) {
    if (!userId) { setProfile(null); return }
    // Own full profile via a SECURITY DEFINER RPC — the base `profiles`
    // table no longer grants a blanket select('*') to authenticated
    // clients (the email column is column-revoked to stop PII harvesting).
    const { data } = await supabase
      .rpc('get_my_profile')
      .maybeSingle()
    setProfile(data)
  }
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      await fetchProfile(session?.user?.id ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      fetchProfile(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])
  async function signOut() {
    await supabase.auth.signOut()
  }
  async function refreshProfile() {
    if (user?.id) await fetchProfile(user.id)
  }
  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  return useContext(AuthContext)
}

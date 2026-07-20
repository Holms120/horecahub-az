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
    const { data, error } = await supabase
      .rpc('get_my_profile')
      .maybeSingle()
    // Swallowing this used to silently strip is_admin app-wide, so an admin
    // would look like a normal user after one failed RPC. Keep the previous
    // profile rather than clobbering it with null on a transient failure.
    if (error) {
      console.warn('get_my_profile failed:', error.message)
      return
    }
    setProfile(data)
  }
  useEffect(() => {
    // loading must settle on EVERY path: pages gated on it (Messages, and any
    // auth-guarded route) render a full-screen spinner until it flips, so an
    // unhandled rejection here means the page never opens at all.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      await fetchProfile(session?.user?.id ?? null)
    }).catch(e => {
      console.warn('getSession failed:', e)
    }).finally(() => {
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

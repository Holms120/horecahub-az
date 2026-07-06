import { supabase } from '../supabaseClient'

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-telegram`

// Fire-and-forget admin Telegram notification. Sends the caller's access
// token when a session exists so the edge function can distinguish real
// users from anonymous callers (anonymous calls are rate-limited there).
export async function notifyTelegram(payload) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY
    await fetch(FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    console.warn('Telegram notification failed:', e)
  }
}

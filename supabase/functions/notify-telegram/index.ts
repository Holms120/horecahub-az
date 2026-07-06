import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_ID   = Deno.env.get('TELEGRAM_CHAT_ID')
const ALLOWED_ORIGIN     = Deno.env.get('SITE_ORIGIN') ?? 'https://horecahub.az'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Telegram HTML parse mode only needs &, <, > escaped. This neutralises
// any markup / link injection coming from user-controlled fields.
function esc(v: unknown, max = 200): string {
  return String(v ?? '')
    .slice(0, max)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// The gateway's verify_jwt only proves the caller holds the (public) anon
// key. Logged-in callers send their session JWT instead; anonymous callers
// (e.g. the registration form before a session exists) stay allowed but are
// rate-limited per function instance to cap Telegram spam.
const ANON_LIMIT     = 5
const ANON_WINDOW_MS = 60_000
let anonCalls: number[] = []

async function isRealUser(token: string): Promise<boolean> {
  if (!token) return false
  try {
    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      },
    })
    return res.ok
  } catch {
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!(await isRealUser(token))) {
    const now = Date.now()
    anonCalls = anonCalls.filter((t) => now - t < ANON_WINDOW_MS)
    if (anonCalls.length >= ANON_LIMIT) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    anonCalls.push(now)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { title, category, city, user_name } = body

    const parts = [`🔔 <b>${esc(title)}</b>`]
    if (category)  parts.push(`📂 <b>Kateqoriya:</b> ${esc(category, 80)}`)
    if (city)      parts.push(`📍 <b>Şəhər:</b> ${esc(city, 80)}`)
    if (user_name) parts.push(`👤 <b>İstifadəçi:</b> ${esc(user_name, 120)}`)
    parts.push(`\n✅ <a href="https://horecahub.az/admin">Admin panelə gir</a>`)
    const message = parts.join('\n')

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      }
    )

    // Do not echo the Telegram API response back to the caller.
    return new Response(JSON.stringify({ ok: response.ok }), {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (_err) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

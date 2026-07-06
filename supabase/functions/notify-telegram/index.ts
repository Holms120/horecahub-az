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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
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

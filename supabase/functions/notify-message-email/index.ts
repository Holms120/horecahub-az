import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_ADDRESS   = 'HorecaHub.az <noreply@horecahub.az>'
const SITE_URL       = Deno.env.get('SITE_URL') ?? 'https://horecahub.az'
const ALLOWED_ORIGIN = Deno.env.get('SITE_ORIGIN') ?? 'https://horecahub.az'

const CORS = {
  'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Only notify for messages inserted within this window — the client calls
// us right after INSERT, anything older is a replayed id.
const MAX_AGE_MS = 5 * 60 * 1000

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function buildHtml(senderName: string, listingTitle: string, preview: string): string {
  const name    = escapeHtml(senderName || 'HorecaHub istifadəçisi')
  const title   = escapeHtml(listingTitle)
  const excerpt = escapeHtml(preview)
  const inboxUrl = `${SITE_URL}/messages`
  return `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HorecaHub.az — Yeni mesaj</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 16px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04); overflow: hidden; }
    .header { background-color: #0A2342; padding: 32px 40px; text-align: center; }
    .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .logo-dot { color: #3b82f6; }
    .logo-tagline { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 4px; letter-spacing: 0.8px; text-transform: uppercase; }
    .body { padding: 40px 40px 32px; }
    .greeting { font-size: 20px; font-weight: 700; color: #0A2342; margin-bottom: 16px; }
    .text { font-size: 15px; line-height: 1.65; color: #475569; margin-bottom: 12px; }
    .quote { margin: 20px 0; padding: 16px 20px; background: #f1f5f9; border-left: 4px solid #2563EB; border-radius: 0 10px 10px 0; font-size: 15px; line-height: 1.6; color: #0f172a; white-space: pre-wrap; }
    .cta-wrapper { text-align: center; margin: 28px 0 8px; }
    .cta-btn { display: inline-block; background-color: #2563EB; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 36px; border-radius: 10px; letter-spacing: 0.2px; }
    .disclaimer { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-top: 24px; }
    .footer { background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer-text a { color: #64748b; text-decoration: none; }
    @media (max-width: 600px) {
      .body { padding: 28px 24px 24px; }
      .header { padding: 24px 24px; }
      .footer { padding: 16px 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-text">HorecaHub<span class="logo-dot">.</span>az</div>
        <div class="logo-tagline">Azərbaycanın HoReCa Marketplace-i</div>
      </div>
      <div class="body">
        <p class="greeting">Sizə yeni mesaj var 📬</p>
        <p class="text">
          <strong>${name}</strong> «<strong>${title}</strong>» elanınızla bağlı sizə mesaj göndərdi:
        </p>
        <div class="quote">${excerpt}</div>
        <div class="cta-wrapper">
          <a href="${inboxUrl}" class="cta-btn">Mesaja cavab ver</a>
        </div>
        <p class="disclaimer">
          Bu bildirişi HorecaHub.az-da elanınıza yeni mesaj gəldiyi üçün alırsınız.
          Cavab vermək üçün sayta daxil olun — bu emailə birbaşa cavab yazmayın.
        </p>
      </div>
      <div class="footer">
        <p class="footer-text">
          © 2026 HorecaHub.az — Azərbaycanın HoReCa marketplace-i<br/>
          <a href="mailto:noreply@horecahub.az">noreply@horecahub.az</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Caller must be a logged-in user…
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const { message_id } = await req.json().catch(() => ({}))
    if (!message_id) {
      return json({ error: 'message_id required' }, 400)
    }

    const { data: msg } = await supabaseAdmin
      .from('messages')
      .select('id, listing_id, sender_id, receiver_id, content, is_read, created_at')
      .eq('id', message_id)
      .maybeSingle()

    // …and the sender of the message being notified about.
    if (!msg || msg.sender_id !== user.id) {
      return json({ error: 'Not found' }, 404)
    }
    // Support chats (listing_id null) have their own flow.
    if (!msg.listing_id || msg.is_read) {
      return json({ skipped: true })
    }
    if (Date.now() - new Date(msg.created_at).getTime() > MAX_AGE_MS) {
      return json({ skipped: true })
    }

    // Debounce: if the receiver already has older unread messages in this
    // conversation, they were already emailed for this batch.
    const { count: olderUnread } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', msg.listing_id)
      .eq('sender_id', msg.sender_id)
      .eq('receiver_id', msg.receiver_id)
      .eq('is_read', false)
      .lt('created_at', msg.created_at)
    if ((olderUnread ?? 0) > 0) {
      return json({ skipped: true })
    }

    const [{ data: receiver }, { data: senderProfile }, { data: listing }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(msg.receiver_id),
      supabaseAdmin.from('profiles').select('full_name, company_name').eq('id', msg.sender_id).maybeSingle(),
      supabaseAdmin.from('listings').select('title').eq('id', msg.listing_id).maybeSingle(),
    ])

    const email = receiver?.user?.email
    if (!email) {
      return json({ skipped: true })
    }

    const senderName   = senderProfile?.full_name || senderProfile?.company_name || ''
    const listingTitle = listing?.title || 'Elan'
    const preview      = msg.content.length > 300 ? `${msg.content.slice(0, 300)}…` : msg.content

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_ADDRESS,
        to:      [email],
        subject: `HorecaHub.az — «${listingTitle}» elanınıza yeni mesaj`,
        html:    buildHtml(senderName, listingTitle, preview),
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error('Resend error:', err)
      return json({ error: 'send failed' }, 500)
    }

    return json({ sent: true })
  } catch (err) {
    console.error('Function error:', err)
    return json({ error: String(err) }, 500)
  }
})

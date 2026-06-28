import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_ADDRESS   = 'HorecaHub.az <noreply@horecahub.az>'
const SITE_URL       = Deno.env.get('SITE_URL') ?? 'https://horecahub.az'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildConfirmUrl(payload: EmailHookPayload): string {
  const { token_hash, redirect_to, site_url } = payload.email_data
  const base = site_url || SITE_URL
  const redirectTo = redirect_to || base
  return `https://ehlgmylgsaegsazobexw.supabase.co/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${encodeURIComponent(redirectTo)}`
}

function buildHtml(name: string, confirmUrl: string): string {
  const displayName = name || 'İstifadəçi'
  return `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HorecaHub.az — Email Təsdiqi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 16px;
    }
    .card {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    /* ─── Header ─── */
    .header {
      background-color: #0A2342;
      padding: 32px 40px;
      text-align: center;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .logo-dot {
      color: #3b82f6;
    }
    .logo-tagline {
      font-size: 11px;
      color: rgba(255,255,255,0.55);
      margin-top: 4px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    /* ─── Body ─── */
    .body {
      padding: 40px 40px 32px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 700;
      color: #0A2342;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      line-height: 1.65;
      color: #475569;
      margin-bottom: 12px;
    }
    .highlight {
      font-size: 15px;
      line-height: 1.65;
      color: #0f172a;
      font-weight: 500;
    }
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 28px 0;
    }
    /* ─── CTA ─── */
    .cta-wrapper {
      text-align: center;
      margin: 28px 0 24px;
    }
    .cta-btn {
      display: inline-block;
      background-color: #2563EB;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 10px;
      letter-spacing: 0.2px;
    }
    .cta-fallback {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 14px;
      line-height: 1.5;
    }
    .cta-fallback a {
      color: #2563EB;
      word-break: break-all;
    }
    .disclaimer {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-top: 4px;
    }
    /* ─── Footer ─── */
    .footer {
      background-color: #f1f5f9;
      padding: 20px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-text a {
      color: #64748b;
      text-decoration: none;
    }
    /* ─── Responsive ─── */
    @media (max-width: 600px) {
      .body  { padding: 28px 24px 24px; }
      .header { padding: 24px 24px; }
      .footer { padding: 16px 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- Header -->
      <div class="header">
        <div class="logo-text">HorecaHub<span class="logo-dot">.</span>az</div>
        <div class="logo-tagline">Azərbaycanın HoReCa Marketplace-i</div>
      </div>

      <!-- Body -->
      <div class="body">
        <p class="greeting">HorecaHub.az-a xoş gəldiniz!</p>

        <p class="text">Salam, <strong>${displayName}</strong>!</p>

        <p class="text">
          HorecaHub.az-da qeydiyyatınız uğurla tamamlandı.
          Azərbaycanın ilk HoReCa marketplace-inə xoş gəldiniz!
        </p>

        <p class="highlight">
          Hesabınızı aktivləşdirmək üçün aşağıdakı düyməyə klikləyin:
        </p>

        <div class="cta-wrapper">
          <a href="${confirmUrl}" class="cta-btn">Emaili təsdiq et</a>
          <p class="cta-fallback">
            Düymə işləmirsə, bu linkə klikləyin:<br/>
            <a href="${confirmUrl}">${confirmUrl}</a>
          </p>
        </div>

        <hr class="divider" />

        <p class="disclaimer">
          Əgər siz bu hesabı yaratmamısınızsa, bu emaili nəzərə almayın.
          Hesabınıza heç bir dəyişiklik edilməyəcək.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">
          © 2025 HorecaHub.az — Azərbaycanın HoReCa marketplace-i<br/>
          <a href="mailto:noreply@horecahub.az">noreply@horecahub.az</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>`
}

interface EmailHookPayload {
  user: {
    email: string
    user_metadata?: { full_name?: string; [key: string]: unknown }
  }
  email_data: {
    token:        string
    token_hash:   string
    redirect_to:  string
    site_url:     string
    email_action_type: string
    token_new?:      string
    token_hash_new?: string
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  // Require Authorization header — must be called by Supabase Auth Hook (hook secret)
  const hookSecret = Deno.env.get('SEND_CONFIRMATION_HOOK_SECRET')
  const authHeader = req.headers.get('Authorization')

  if (!authHeader || (hookSecret && authHeader !== `Bearer ${hookSecret}`)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
      status: 401,
    })
  }

  try {
    const payload: EmailHookPayload = await req.json()
    const { user, email_data } = payload

    // Only handle signup confirmation
    if (email_data.email_action_type !== 'signup') {
      return new Response(JSON.stringify({ message: 'skipped' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const name       = user.user_metadata?.full_name ?? ''
    const confirmUrl = buildConfirmUrl(payload)
    const html       = buildHtml(name, confirmUrl)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    FROM_ADDRESS,
        to:      [user.email],
        subject: 'HorecaHub.az — Emailinizi təsdiq edin',
        html,
      }),
    })

    if (!resendRes.ok) {
      const err = await resendRes.text()
      console.error('Resend error:', err)
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const result = await resendRes.json()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (err) {
    console.error('Function error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})

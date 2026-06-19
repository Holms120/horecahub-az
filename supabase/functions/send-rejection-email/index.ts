import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, name, title, reason } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'HorecaHub <noreply@horecahub.az>',
        to,
        subject: 'Elanınız rədd edildi — HorecaHub',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a56db;">HorecaHub.az</h2>
            <p>Hörmətli ${name || 'istifadəçi'},</p>
            <p><strong>"${title}"</strong> adlı elanınız təəssüf ki, rədd edildi.</p>
            ${reason ? `<p><strong>Səbəb:</strong> ${reason}</p>` : ''}
            <p>Elanı düzəldib yenidən yerləşdirə bilərsiniz.</p>
            <a href="https://horecahub.az" style="background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px;">HorecaHub.az-a keç</a>
            <p style="color:#888;font-size:12px;margin-top:20px;">HorecaHub.az — Azərbaycanın ilk HoReCa marketplace-i</p>
          </div>
        `,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 400,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

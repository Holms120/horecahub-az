import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGIN = Deno.env.get('SITE_ORIGIN') ?? 'https://horecahub.az'

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── AuthZ: caller must be an authenticated admin ──────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token)
  if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

  const { data: caller } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!caller?.is_admin) return json({ error: 'Forbidden' }, 403)

  // ── Input ─────────────────────────────────────────────────────
  let user_id: string | undefined
  try {
    ({ user_id } = await req.json())
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (!user_id || typeof user_id !== 'string') {
    return json({ error: 'user_id required' }, 400)
  }

  // Prevent an admin from deleting their own account via this endpoint
  if (user_id === user.id) {
    return json({ error: 'Cannot delete your own account' }, 400)
  }

  // ── Delete: profile row first (best-effort), then the auth user.
  // Related rows (listings, messages, favorites) are removed by the
  // ON DELETE CASCADE foreign keys that reference the deleted user.
  const { error: profileErr } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', user_id)
  if (profileErr) return json({ error: profileErr.message }, 400)

  const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(user_id)
  if (authDelErr) return json({ error: authDelErr.message }, 400)

  return json({ success: true }, 200)
})

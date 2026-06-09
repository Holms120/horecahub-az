import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Users, MessageSquare, LayoutDashboard, List,
  Shield, ShieldOff, Send, X, ChevronLeft, Inbox,
  LogOut, CheckCircle2
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

/* ─── helpers ─────────────────────────────────────────── */
function timeStr(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('az-AZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function shortDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('az-AZ')
}

/* ─── Spinner ─────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/* ─── Tab 1 : Dashboard ───────────────────────────────── */
function DashboardTab() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
    ]).then(([l, p, m]) => setStats({
      listings: l.count ?? 0,
      users: p.count ?? 0,
      messages: m.count ?? 0,
    }))
  }, [])

  const cards = stats
    ? [
        { label: 'Aktiv elanlar', value: stats.listings, color: 'text-blue-600' },
        { label: 'İstifadəçilər', value: stats.users, color: 'text-emerald-600' },
        { label: 'Mesajlar', value: stats.messages, color: 'text-purple-600' },
      ]
    : []

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-6">Ümumi statistika</h2>
      {!stats ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-1">{c.label}</p>
              <p className={`text-4xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Tab 2 : Listings ────────────────────────────────── */
function ListingsTab() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('listings')
      .select('id, title, category, status, city, created_at, profiles!left(full_name, company_name)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setListings(data || []); setLoading(false) })
  }, [])

  async function toggleStatus(id, current) {
    const next = current === 'active' ? 'deleted' : 'active'
    await supabase.from('listings').update({ status: next }).eq('id', id)
    setListings(ls => ls.map(l => l.id === id ? { ...l, status: next } : l))
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-6">Elanlar</h2>
      {loading ? <Spinner /> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Başlıq', 'Kateqoriya', 'Sahibi', 'Şəhər', 'Status', 'Tarix', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-navy max-w-[180px] truncate">
                    <Link to={`/listings/${l.id}`} className="hover:text-blue-600">{l.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{l.category}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {l.profiles?.full_name || l.profiles?.company_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{l.city}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{shortDate(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(l.id, l.status)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        l.status === 'active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}>
                      {l.status === 'active' ? 'Sil' : 'Bərpa et'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Tab 3 : Users ───────────────────────────────────── */
function UsersTab({ adminId }) {
  const [users, setUsers] = useState([])
  const [listingCounts, setListingCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [msgTarget, setMsgTarget] = useState(null) // { id, name }
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, company_name, email, phone, account_type, is_blocked, created_at')
      .order('created_at', { ascending: false })
      .then(async ({ data: profiles }) => {
        setUsers(profiles || [])
        // listing counts
        const { data: lData } = await supabase
          .from('listings')
          .select('user_id')
          .eq('status', 'active')
        const counts = {}
        ;(lData || []).forEach(r => { counts[r.user_id] = (counts[r.user_id] || 0) + 1 })
        setListingCounts(counts)
        setLoading(false)
      })
  }, [])

  async function toggleBlock(uid, current) {
    const next = !current
    await supabase.from('profiles').update({ is_blocked: next }).eq('id', uid)
    setUsers(us => us.map(u => u.id === uid ? { ...u, is_blocked: next } : u))
  }

  async function sendSupportMsg() {
    if (!msgText.trim() || !msgTarget) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id:   adminId,
      receiver_id: msgTarget.id,
      listing_id:  null,
      content:     msgText.trim(),
      is_support:  true,
    })
    setSent(true)
    setSending(false)
    setTimeout(() => { setMsgTarget(null); setMsgText(''); setSent(false) }, 1500)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-6">İstifadəçilər</h2>
      {loading ? <Spinner /> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Ad', 'Email', 'Telefon', 'Növ', 'Elan', 'Tarix', 'Status', 'Əməliyyat'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${u.is_blocked ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-medium text-navy">
                    {u.full_name || u.company_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{u.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.account_type === 'supplier'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>{u.account_type || 'fərdi'}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">
                    {listingCounts[u.id] || 0}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{shortDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {u.is_blocked
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Blok</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Aktiv</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleBlock(u.id, u.is_blocked)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          u.is_blocked
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}>
                        {u.is_blocked ? <><ShieldOff size={12} /> Açıq</> : <><Shield size={12} /> Blok</>}
                      </button>
                      <button onClick={() => { setMsgTarget({ id: u.id, name: u.full_name || u.company_name || u.email }); setSent(false) }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <MessageSquare size={12} /> Mesaj
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Send message modal */}
      {msgTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy">Mesaj göndər: {msgTarget.name}</h3>
              <button onClick={() => setMsgTarget(null)} className="p-1 text-gray-400 hover:text-navy">
                <X size={18} />
              </button>
            </div>
            {sent ? (
              <div className="flex items-center gap-2 text-green-600 py-4 justify-center">
                <CheckCircle2 size={20} /> Mesaj göndərildi
              </div>
            ) : (
              <>
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setMsgTarget(null)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
                    Ləğv et
                  </button>
                  <button onClick={sendSupportMsg} disabled={!msgText.trim() || sending}
                    className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                    <Send size={14} /> {sending ? 'Göndərilir...' : 'Göndər'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Tab 4 : Support ─────────────────────────────────── */
function SupportTab({ adminId }) {
  const [convs, setConvs] = useState([])   // { userId, name, messages[], unread }
  const [profiles, setProfiles] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const threadRef = useRef(null)

  async function load() {
    setLoading(true)
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('is_support', true)
      .order('created_at', { ascending: true })

    if (!msgs?.length) { setConvs([]); setLoading(false); return }

    // group by the non-admin side
    const map = {}
    for (const m of msgs) {
      const otherId = m.sender_id === adminId ? m.receiver_id : m.sender_id
      if (!map[otherId]) map[otherId] = { userId: otherId, messages: [], unread: 0 }
      map[otherId].messages.push(m)
      if (m.receiver_id === adminId && !m.is_read) map[otherId].unread++
    }

    const list = Object.values(map).sort(
      (a, b) => new Date(b.messages.at(-1).created_at) - new Date(a.messages.at(-1).created_at)
    )
    setConvs(list)

    // fetch profile names
    const ids = list.map(c => c.userId)
    const { data: pData } = await supabase.from('profiles')
      .select('id, full_name, company_name, email').in('id', ids)
    const pm = {}
    ;(pData || []).forEach(p => { pm[p.id] = p })
    setProfiles(pm)
    setLoading(false)
  }

  useEffect(() => { load() }, [adminId])

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [activeId, convs])

  async function markRead(userId) {
    await supabase.from('messages')
      .update({ is_read: true })
      .eq('is_support', true)
      .eq('sender_id', userId)
      .eq('receiver_id', adminId)
      .eq('is_read', false)
    setConvs(cs => cs.map(c => c.userId === userId ? { ...c, unread: 0 } : c))
  }

  function openConv(userId) {
    setActiveId(userId)
    markRead(userId)
  }

  async function sendReply() {
    if (!reply.trim() || !activeId) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id:   adminId,
      receiver_id: activeId,
      listing_id:  null,
      content:     reply.trim(),
      is_support:  true,
    })
    setReply('')
    await load()
    setSending(false)
  }

  const activeConv = convs.find(c => c.userId === activeId)

  function displayName(uid) {
    const p = profiles[uid]
    return p?.full_name || p?.company_name || p?.email || 'İstifadəçi'
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-6">Support mesajları</h2>
      {loading ? <Spinner /> : convs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Inbox size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Hələ support mesajı yoxdur</p>
        </div>
      ) : (
        <div className="flex border border-gray-200 rounded-2xl overflow-hidden bg-white"
          style={{ height: 'calc(100vh - 240px)', minHeight: 480 }}>

          {/* Conversation list */}
          <div className={`w-72 flex-shrink-0 border-r border-gray-200 overflow-y-auto ${activeId ? 'hidden sm:block' : 'block'}`}>
            {convs.map(c => (
              <button key={c.userId} onClick={() => openConv(c.userId)}
                className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  activeId === c.userId ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : ''
                }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-navy truncate">{displayName(c.userId)}</span>
                  {c.unread > 0 && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {c.messages.at(-1)?.content}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {timeStr(c.messages.at(-1)?.created_at)}
                </p>
              </button>
            ))}
          </div>

          {/* Thread */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Sol tərəfdən söhbət seçin
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                  <button className="sm:hidden p-1 text-gray-500" onClick={() => setActiveId(null)}>
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-semibold text-navy text-sm">{displayName(activeConv.userId)}</span>
                </div>

                {/* Messages */}
                <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeConv.messages.map(m => {
                    const mine = m.sender_id === adminId
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-navy rounded-bl-sm'
                        }`}>
                          <p className="leading-relaxed break-words">{m.content}</p>
                          <p className={`text-[10px] mt-1 ${mine ? 'text-blue-200' : 'text-gray-400'}`}>
                            {timeStr(m.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Reply box */}
                <div className="p-3 border-t border-gray-100 flex-shrink-0">
                  <div className="flex gap-2">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                      placeholder="Cavab yazın... (Enter ilə göndər)"
                      rows={2}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                    <button onClick={sendReply} disabled={!reply.trim() || sending}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main Admin component ────────────────────────────── */
const TABS = [
  { id: 'dashboard',  label: 'Ümumi',          icon: LayoutDashboard },
  { id: 'listings',   label: 'Elanlar',         icon: List },
  { id: 'users',      label: 'İstifadəçilər',   icon: Users },
  { id: 'support',    label: 'Support',          icon: MessageSquare },
]

export default function Admin() {
  const { user, profile, loading, signOut } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [supportBadge, setSupportBadge] = useState(0)

  // Unread support count
  useEffect(() => {
    if (!user) return
    supabase.from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_support', true)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setSupportBadge(count || 0))
  }, [user])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (profile !== null && !profile?.is_admin) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#0A2342] text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <Link to="/" className="text-white font-bold text-lg tracking-tight">HorecaHub</Link>
          <p className="text-white/40 text-xs mt-0.5">Admin panel</p>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {TABS.map(t => {
            const Icon = t.icon
            const badge = t.id === 'support' && supportBadge > 0 ? supportBadge : 0
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}>
                <Icon size={16} />
                {t.label}
                {badge > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
            <LogOut size={16} /> Çıxış
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-8">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'listings'  && <ListingsTab />}
        {tab === 'users'     && <UsersTab adminId={user.id} />}
        {tab === 'support'   && <SupportTab adminId={user.id} />}
      </main>
    </div>
  )
}

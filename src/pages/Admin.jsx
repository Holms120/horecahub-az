import { useState, useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Users, MessageSquare, LayoutDashboard, List,
  Shield, ShieldOff, Send, X, ChevronLeft, Inbox,
  LogOut, CheckCircle2, Eye, Heart, TrendingUp, AlertCircle,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
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
function weekStart() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/* ─── Spinner ─────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/* ─── Error banner ───────────────────────────────────── */
function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
      <AlertCircle size={16} className="flex-shrink-0" /> {msg}
    </div>
  )
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

/* ─── Tab 1 : Dashboard ───────────────────────────────── */
function DashboardTab() {
  const [stats, setStats]           = useState(null)
  const [chartData, setChartData]   = useState([])
  const [catData, setCatData]       = useState([])
  const [topListings, setTopListings] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const ws = weekStart()
        const [activeRes, usersRes, msgsRes, newListRes, newUsrRes, catRes, pendingRes] = await Promise.all([
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
          supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', ws),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', ws),
          supabase.from('listings').select('category').eq('status', 'active'),
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ])

        setStats({
          listings:        activeRes.count  ?? 0,
          users:           usersRes.count   ?? 0,
          messages:        msgsRes.count    ?? 0,
          newListings:     newListRes.count ?? 0,
          newUsers:        newUsrRes.count  ?? 0,
          pendingListings: pendingRes.count ?? 0,
        })

        // Category distribution
        const cc = {}
        ;(catRes.data || []).forEach(r => { cc[r.category] = (cc[r.category] || 0) + 1 })
        setCatData(Object.entries(cc).map(([name, value]) => ({ name, value })))

        // Daily views last 30 days
        const from = new Date()
        from.setDate(from.getDate() - 29)
        from.setHours(0, 0, 0, 0)
        const { data: viewsData } = await supabase
          .from('listing_views')
          .select('created_at')
          .gte('created_at', from.toISOString())

        const byDate = {}
        for (let i = 29; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const key = d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' })
          byDate[key] = 0
        }
        ;(viewsData || []).forEach(v => {
          const key = new Date(v.created_at).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' })
          if (key in byDate) byDate[key]++
        })
        setChartData(Object.entries(byDate).map(([date, views]) => ({ date, views })))

        // Top 5 by views
        const { data: topData } = await supabase
          .from('listings')
          .select('id, title, category')
          .eq('status', 'active')
          .limit(30)

        if (topData?.length) {
          const ids = topData.map(l => l.id)
          const { data: vcData } = await supabase
            .from('listing_views')
            .select('listing_id')
            .in('listing_id', ids)

          const vc = {}
          ;(vcData || []).forEach(v => { vc[v.listing_id] = (vc[v.listing_id] || 0) + 1 })
          setTopListings(
            topData
              .map(l => ({ ...l, views: vc[l.id] || 0 }))
              .sort((a, b) => b.views - a.views)
              .slice(0, 5)
          )
        }
      } catch (e) {
        setError('Məlumatlar yüklənərkən xəta baş verdi: ' + (e.message || ''))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-[#0A2342]">Ümumi statistika</h2>
      {error && <ErrorBanner msg={error} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats && [
          { label: 'Aktiv elanlar',       value: stats.listings,        color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'İstifadəçilər',       value: stats.users,           color: 'text-emerald-600',bg: 'bg-emerald-50'},
          { label: 'Moderasiya gözləyir', value: stats.pendingListings, color: 'text-amber-600',  bg: 'bg-amber-50'  },
          { label: 'Bu həftə elanlar',    value: stats.newListings,     color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Bu həftə qeydiyyat',  value: stats.newUsers,        color: 'text-pink-600',   bg: 'bg-pink-50'   },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-5`}>
            <p className="text-xs text-gray-500 mb-1 leading-snug">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-blue-600" /> Son 30 günün baxışları
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={6} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} name="Baxış" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {catData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[#0A2342] mb-4">Kateqoriyalar üzrə elanlar</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top 5 */}
      {topListings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
            <Eye size={15} className="text-blue-600" /> Ən çox baxılan 5 elan
          </h3>
          <div className="space-y-1">
            {topListings.map((l, i) => (
              <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <Link to={`/listings/${l.id}`}
                  className="flex-1 text-sm font-medium text-[#0A2342] hover:text-blue-600 truncate">
                  {l.title || '(başlıqsız)'}
                </Link>
                <span className="text-xs text-gray-400">{l.category}</span>
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 flex-shrink-0">
                  <Eye size={11} /> {l.views}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Tab 2 : Listings ────────────────────────────────── */
function ListingsTab({ adminId }) {
  const [listings, setListings]       = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [msgTarget, setMsgTarget]     = useState(null)
  const [msgText, setMsgText]         = useState('')
  const [sending, setSending]         = useState(false)
  const [sent, setSent]               = useState(false)

  useEffect(() => {
    async function load() {
      try {
        let query = supabase
          .from('listings')
          .select('id, title, category, status, city, created_at, user_id, profiles!left(id, full_name, company_name)')
          .order('created_at', { ascending: false })
          .limit(200)

        const { data, error: err } = await query

        if (err) throw err

        const items = data || []
        const ids = items.map(l => l.id)

        const [viewsRes, favsRes] = await Promise.all([
          ids.length ? supabase.from('listing_views').select('listing_id').in('listing_id', ids) : { data: [] },
          ids.length ? supabase.from('favorites').select('listing_id').in('listing_id', ids)     : { data: [] },
        ])

        const vc = {}
        const fc = {}
        ;(viewsRes.data || []).forEach(v => { vc[v.listing_id] = (vc[v.listing_id] || 0) + 1 })
        ;(favsRes.data  || []).forEach(f => { fc[f.listing_id] = (fc[f.listing_id] || 0) + 1 })

        setListings(items.map(l => ({ ...l, views: vc[l.id] || 0, favorites: fc[l.id] || 0 })))
      } catch (e) {
        setError('Elanlar yüklənərkən xəta baş verdi: ' + (e.message || ''))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function changeStatus(id, next) {
    const { error } = await supabase.from('listings').update({ status: next }).eq('id', id)
    if (!error) setListings(ls => ls.map(l => l.id === id ? { ...l, status: next } : l))
  }

  async function sendMsg() {
    if (!msgText.trim() || !msgTarget) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      sender_id:   adminId,
      receiver_id: msgTarget.userId,
      listing_id:  null,
      content:     msgText.trim(),
      is_support:  true,
    })
    if (!error) {
      setSent(true)
      setTimeout(() => { setMsgTarget(null); setMsgText(''); setSent(false) }, 1500)
    }
    setSending(false)
  }

  const STATUS_OPTS = ['active', 'pending', 'rejected', 'deleted']
  const statusColor = s =>
    s === 'active'   ? 'bg-green-100 text-green-700' :
    s === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
    s === 'rejected' ? 'bg-red-100 text-red-600' :
    'bg-gray-100 text-gray-500'

  const filtered = statusFilter === 'all' ? listings : listings.filter(l => l.status === statusFilter)
  const pendingCount = listings.filter(l => l.status === 'pending').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0A2342]">
          Elanlar
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full">
              {pendingCount}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'rejected', 'deleted'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === s
                  ? s === 'pending' ? 'bg-amber-500 text-white' : 'bg-[#0A2342] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s === 'all' ? 'Hamısı' : s}
              {s === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
            </button>
          ))}
        </div>
      </div>
      {error && <ErrorBanner msg={error} />}
      {loading ? <Spinner /> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Başlıq', 'Kateqoriya', 'Sahibi', 'Şəhər', 'Baxış', 'Fav', 'Status', 'Tarix', ''].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(l => (
                <tr key={l.id} className={`hover:bg-gray-50 ${l.status === 'pending' ? 'bg-amber-50/60' : ''}`}>
                  <td className="px-3 py-3 font-medium text-[#0A2342] max-w-[160px] truncate">
                    <Link to={`/listings/${l.id}`} className="hover:text-blue-600">{l.title || '—'}</Link>
                  </td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{l.category}</td>
                  <td className="px-3 py-3 text-gray-500 max-w-[110px] truncate">
                    {l.profiles?.full_name || l.profiles?.company_name || '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-500">{l.city || '—'}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Eye size={11} className="text-gray-400" /> {l.views}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <Heart size={11} className="text-gray-400" /> {l.favorites}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={l.status}
                      onChange={e => changeStatus(l.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none ${statusColor(l.status)}`}
                    >
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{shortDate(l.created_at)}</td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => {
                        setMsgTarget({ userId: l.user_id, name: l.profiles?.full_name || l.profiles?.company_name || 'İstifadəçi' })
                        setSent(false)
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      <MessageSquare size={11} /> Mesaj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {msgTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0A2342]">Mesaj göndər: {msgTarget.name}</h3>
              <button onClick={() => setMsgTarget(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            {sent ? (
              <div className="flex items-center gap-2 text-green-600 py-4 justify-center">
                <CheckCircle2 size={20} /> Mesaj göndərildi
              </div>
            ) : (
              <>
                <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Mesajınızı yazın..." rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setMsgTarget(null)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
                    Ləğv et
                  </button>
                  <button onClick={sendMsg} disabled={!msgText.trim() || sending}
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

/* ─── Tab 3 : Users ───────────────────────────────────── */
function UsersTab({ adminId }) {
  const [users, setUsers]               = useState([])
  const [listingCounts, setListingCounts] = useState({})
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [msgTarget, setMsgTarget]       = useState(null)
  const [msgText, setMsgText]           = useState('')
  const [sending, setSending]           = useState(false)
  const [sent, setSent]                 = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: profiles, error: err } = await supabase
          .from('profiles')
          .select('id, full_name, company_name, email, phone, account_type, is_blocked, created_at')
          .order('created_at', { ascending: false })

        if (err) throw err
        setUsers(profiles || [])

        const { data: lData, error: lErr } = await supabase
          .from('listings')
          .select('user_id')
          .eq('status', 'active')

        if (!lErr) {
          const counts = {}
          ;(lData || []).forEach(r => { counts[r.user_id] = (counts[r.user_id] || 0) + 1 })
          setListingCounts(counts)
        }
      } catch (e) {
        setError('İstifadəçilər yüklənərkən xəta baş verdi: ' + (e.message || ''))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function toggleBlock(uid, current) {
    const { error } = await supabase.from('profiles').update({ is_blocked: !current }).eq('id', uid)
    if (!error) setUsers(us => us.map(u => u.id === uid ? { ...u, is_blocked: !current } : u))
  }

  async function sendSupportMsg() {
    if (!msgText.trim() || !msgTarget) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      sender_id:   adminId,
      receiver_id: msgTarget.id,
      listing_id:  null,
      content:     msgText.trim(),
      is_support:  true,
    })
    if (!error) {
      setSent(true)
      setTimeout(() => { setMsgTarget(null); setMsgText(''); setSent(false) }, 1500)
    }
    setSending(false)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0A2342] mb-6">İstifadəçilər</h2>
      {error && <ErrorBanner msg={error} />}
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
                  <td className="px-4 py-3 font-medium text-[#0A2342] whitespace-nowrap">
                    {u.full_name || u.company_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[170px] truncate">{u.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      u.account_type === 'supplier' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'
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
                      <button
                        onClick={() => { setMsgTarget({ id: u.id, name: u.full_name || u.company_name || u.email }); setSent(false) }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
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

      {msgTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0A2342]">Mesaj göndər: {msgTarget.name}</h3>
              <button onClick={() => setMsgTarget(null)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            {sent ? (
              <div className="flex items-center gap-2 text-green-600 py-4 justify-center">
                <CheckCircle2 size={20} /> Mesaj göndərildi
              </div>
            ) : (
              <>
                <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Mesajınızı yazın..." rows={4}
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
  const [convs, setConvs]       = useState([])
  const [profiles, setProfiles] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [reply, setReply]       = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const threadRef = useRef(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data: msgs, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('is_support', true)
        .order('created_at', { ascending: true })

      if (err) throw err
      if (!msgs?.length) { setConvs([]); setLoading(false); return }

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

      const ids = list.map(c => c.userId)
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .in('id', ids)

      const pm = {}
      ;(pData || []).forEach(p => { pm[p.id] = p })
      setProfiles(pm)
    } catch (e) {
      setError('Support mesajları yüklənərkən xəta baş verdi: ' + (e.message || ''))
    } finally {
      setLoading(false)
    }
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
    const { error } = await supabase.from('messages').insert({
      sender_id:   adminId,
      receiver_id: activeId,
      listing_id:  null,
      content:     reply.trim(),
      is_support:  true,
    })
    if (!error) {
      setReply('')
      await load()
    }
    setSending(false)
  }

  const activeConv = convs.find(c => c.userId === activeId)

  function displayName(uid) {
    const p = profiles[uid]
    return p?.full_name || p?.company_name || p?.email || 'İstifadəçi'
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0A2342] mb-6">Support mesajları</h2>
      {error && <ErrorBanner msg={error} />}
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
                  <span className="text-sm font-semibold text-[#0A2342] truncate">{displayName(c.userId)}</span>
                  {c.unread > 0 && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{c.messages.at(-1)?.content}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{timeStr(c.messages.at(-1)?.created_at)}</p>
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
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                  <button className="sm:hidden p-1 text-gray-500" onClick={() => setActiveId(null)}>
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-semibold text-[#0A2342] text-sm">{displayName(activeConv.userId)}</span>
                </div>

                <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeConv.messages.map(m => {
                    const mine = m.sender_id === adminId
                    return (
                      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-[#0A2342] rounded-bl-sm'
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
  { id: 'dashboard', label: 'Ümumi',        icon: LayoutDashboard },
  { id: 'listings',  label: 'Elanlar',       icon: List },
  { id: 'users',     label: 'İstifadəçilər', icon: Users },
  { id: 'support',   label: 'Support',       icon: MessageSquare },
]

export default function Admin() {
  const { user, profile, loading, signOut } = useAuth()
  const [tab, setTab]                   = useState('dashboard')
  const [supportBadge, setSupportBadge] = useState(0)
  const [pendingBadge, setPendingBadge] = useState(0)

  // Initial counts
  useEffect(() => {
    if (!user) return
    supabase.from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_support', true)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setSupportBadge(count || 0))

    supabase.from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingBadge(count || 0))
  }, [user])

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'listings',
      }, payload => {
        if (payload.new?.status === 'pending') setPendingBadge(n => n + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'listings',
      }, payload => {
        if (payload.new?.status === 'active' && payload.old?.status === 'pending')
          setPendingBadge(n => Math.max(0, n - 1))
        if (payload.new?.status === 'pending' && payload.old?.status !== 'pending')
          setPendingBadge(n => n + 1)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, payload => {
        if (payload.new?.is_support && payload.new?.receiver_id === user.id)
          setSupportBadge(n => n + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (profile !== null && !profile?.is_admin) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 flex-shrink-0 bg-[#0A2342] text-white flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <Link to="/" className="text-white font-bold text-lg tracking-tight">HorecaHub</Link>
          <p className="text-white/40 text-xs mt-0.5">Admin panel</p>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {TABS.map(t => {
            const Icon = t.icon
            const badge = t.id === 'support' ? supportBadge : t.id === 'listings' ? pendingBadge : 0
            const badgeColor = t.id === 'listings' ? 'bg-amber-500' : 'bg-red-500'
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}>
                <Icon size={16} />
                {t.label}
                {badge > 0 && (
                  <span className={`ml-auto w-5 h-5 ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>
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

      <main className="flex-1 overflow-auto p-8">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'listings'  && <ListingsTab adminId={user.id} />}
        {tab === 'users'     && <UsersTab adminId={user.id} />}
        {tab === 'support'   && <SupportTab adminId={user.id} />}
      </main>
    </div>
  )
}

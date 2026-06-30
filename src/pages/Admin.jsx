import { useState, useEffect, useRef, Fragment } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Users, MessageSquare, LayoutDashboard, List,
  Shield, ShieldOff, Send, X, ChevronLeft, Inbox,
  LogOut, CheckCircle2, Eye, Heart, TrendingUp, AlertCircle,
  Download, Search, Settings, BarChart2, Bell, Phone,
  ChevronDown, ChevronUp, Check, XCircle, Tag, MessageCircle, Menu, Trash2,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

/* ─── helpers ───────────────────────────────────────────── */
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
  const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0)
  return d.toISOString()
}
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0)
  return d.toISOString()
}
function buildDayLabels(n) {
  const labels = {}
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' })
    labels[key] = 0
  }
  return labels
}
function exportCSV(rows, filename) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [
    keys.join(','),
    ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#0ea5e9']
function statusColor(s) {
  if (s === 'active')   return 'bg-green-100 text-green-700'
  if (s === 'pending')  return 'bg-yellow-100 text-yellow-700'
  if (s === 'rejected') return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-500'
}

/* ─── Shared UI ─────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4">
      <AlertCircle size={16} className="flex-shrink-0" /> {msg}
    </div>
  )
}
function SendMsgModal({ receiverId, senderId, receiverName, onClose }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      sender_id: senderId, receiver_id: receiverId,
      listing_id: null, content: text.trim(), is_support: true,
    })
    if (!error) { setSent(true); setTimeout(onClose, 1500) }
    setSending(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0A2342]">Mesaj göndər: {receiverName}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {sent ? (
          <div className="flex items-center gap-2 text-green-600 py-4 justify-center">
            <CheckCircle2 size={20} /> Mesaj göndərildi
          </div>
        ) : (
          <>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Mesajınızı yazın..." rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Ləğv et</button>
              <button onClick={handleSend} disabled={!text.trim() || sending}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <Send size={14} /> {sending ? 'Göndərilir...' : 'Göndər'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Tab 1: Dashboard ──────────────────────────────────── */
function DashboardTab({ realtimeEvents }) {
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
        const [allRes, activeRes, pendingRes, usersRes, newListRes, newUsrRes, catRes, phoneClicksRes, phoneClicksRes2] = await Promise.all([
          supabase.from('listings').select('*', { count: 'exact', head: true }),
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', ws),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', ws),
          supabase.from('listings').select('category').eq('status', 'active'),
          supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).gte('created_at', ws).not('user_id', 'is', null),
          supabase.from('phone_clicks').select('*', { count: 'exact', head: true }).gte('created_at', ws).is('user_id', null),
        ])
        setStats({
          allListings:       allRes.count            ?? 0,
          listings:          activeRes.count         ?? 0,
          pendingListings:   pendingRes.count        ?? 0,
          users:             usersRes.count          ?? 0,
          newListings:       newListRes.count        ?? 0,
          newUsers:          newUsrRes.count         ?? 0,
          phoneClicksAuth:   phoneClicksRes.count    ?? 0,
          phoneClicksAnon:   phoneClicksRes2.count   ?? 0,
        })
        const cc = {}
        ;(catRes.data || []).forEach(r => { cc[r.category] = (cc[r.category] || 0) + 1 })
        setCatData(Object.entries(cc).map(([name, value]) => ({ name, value })))

        const from = new Date(); from.setDate(from.getDate() - 29); from.setHours(0,0,0,0)
        const { data: viewsData } = await supabase
          .from('listing_views').select('created_at').gte('created_at', from.toISOString())
        const byDate = buildDayLabels(30)
        ;(viewsData || []).forEach(v => {
          const key = new Date(v.created_at).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' })
          if (key in byDate) byDate[key]++
        })
        setChartData(Object.entries(byDate).map(([date, views]) => ({ date, views })))

        const { data: topData } = await supabase
          .from('listings').select('id, title, category').eq('status', 'active').limit(30)
        if (topData?.length) {
          const ids = topData.map(l => l.id)
          const { data: vcData } = await supabase
            .from('listing_views').select('listing_id').in('listing_id', ids)
          const vc = {}
          ;(vcData || []).forEach(v => { vc[v.listing_id] = (vc[v.listing_id] || 0) + 1 })
          setTopListings(
            topData.map(l => ({ ...l, views: vc[l.id] || 0 }))
              .sort((a, b) => b.views - a.views).slice(0, 5)
          )
        }
      } catch (e) {
        setError('Məlumatlar yüklənərkən xəta: ' + (e.message || ''))
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

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {stats && [
          { label: 'Cəmi elanlar',           value: stats.allListings,     color: 'text-gray-700',    bg: 'bg-gray-100'    },
          { label: 'Aktiv elanlar',           value: stats.listings,        color: 'text-blue-600',    bg: 'bg-blue-50'     },
          { label: 'Gözləyir',               value: stats.pendingListings, color: 'text-amber-600',   bg: 'bg-amber-50'    },
          { label: 'Bu həftə elanlar',        value: stats.newListings,     color: 'text-orange-600',  bg: 'bg-orange-50'   },
          { label: 'Cəmi istifadəçilər',     value: stats.users,           color: 'text-emerald-600', bg: 'bg-emerald-50'  },
          { label: 'Bu həftə qeydiyyat',     value: stats.newUsers,        color: 'text-pink-600',    bg: 'bg-pink-50'     },
          { label: 'Tel. klik (üzv)',    value: stats.phoneClicksAuth, color: 'text-purple-600',  bg: 'bg-purple-50'   },
          { label: 'Tel. klik (anonim)', value: stats.phoneClicksAnon, color: 'text-violet-600',  bg: 'bg-violet-50'   },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-5`}>
            <p className="text-xs text-gray-500 mb-1 leading-snug">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

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
                <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topListings.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
              <Eye size={15} className="text-blue-600" /> Ən çox baxılan 5 elan
            </h3>
            <div className="space-y-1">
              {topListings.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                  <Link to={`/listings/${l.id}`} className="flex-1 text-sm font-medium text-[#0A2342] hover:text-blue-600 truncate">{l.title || '(başlıqsız)'}</Link>
                  <span className="text-xs text-gray-400">{l.category}</span>
                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 flex-shrink-0"><Eye size={11} /> {l.views}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time notifications */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[#0A2342] mb-4 flex items-center gap-2">
            <Bell size={15} className="text-blue-600" /> Canlı bildirişlər
          </h3>
          {realtimeEvents.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Hələ yeni hadisə yoxdur</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {realtimeEvents.map((ev, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                  ev.type === 'pending'  ? 'bg-amber-50'  :
                  ev.type === 'support' ? 'bg-blue-50'   :
                  'bg-green-50'
                }`}>
                  <span className="text-lg flex-shrink-0">{ev.type === 'pending' ? '📋' : ev.type === 'support' ? '💬' : '👤'}</span>
                  <div>
                    <p className="font-medium text-[#0A2342]">{ev.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Tab 2: Moderation ─────────────────────────────────── */
function ModerationTab({ adminId, onApprove }) {
  const [listings, setListings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [processing, setProcessing] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  async function load() {
    setLoading(true); setError(null)
    try {
      const { data, error: err } = await supabase
        .from('listings')
        .select('id, title, category, city, images, user_id, created_at, profiles(id, full_name, company_name, phone)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (err) { setError('Supabase xətası: ' + err.message); setLoading(false); return }
      setListings(data || [])
    } catch (e) {
      setError('Moderasiya elanları yüklənərkən xəta: ' + (e.message || String(e)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const channel = supabase
      .channel('moderation-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'listings',
        filter: 'status=eq.pending'
      }, async (payload) => {
        const { data } = await supabase
          .from('listings')
          .select('id, title, category, city, images, user_id, created_at, profiles(id, full_name, company_name, phone)')
          .eq('id', payload.new.id)
          .single()
        if (data) {
          setListings(prev => [data, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleApprove(listing) {
    setProcessing(listing.id)
    const { error } = await supabase
      .from('listings')
      .update({ status: 'active' })
      .eq('id', listing.id)

    if (!error) {
      setListings(ls => ls.filter(l => l.id !== listing.id))
      onApprove?.()

      if (adminId) {
        supabase.from('messages').insert({
          sender_id: adminId,
          receiver_id: listing.user_id,
          listing_id: listing.id,
          content: `✅ "${listing.title}" adlı elanınız təsdiqləndi və saytda aktiv oldu.`,
          is_support: true,
        }).then(({ error: msgError }) => {
          if (msgError) console.warn('Message insert failed:', msgError)
        })
      }
    } else {
      console.warn('Approve failed:', error)
    }
    setProcessing(null)
  }

  async function handleRejectConfirm() {
    if (!rejectModal) return

    const modal = rejectModal
    const reason = rejectReason

    setProcessing(modal.id)

    const { error } = await supabase
      .from('listings')
      .update({ status: 'rejected' })
      .eq('id', modal.id)

    if (!error) {
      setListings(ls => ls.filter(l => l.id !== modal.id))
      setRejectModal(null)
      setRejectReason('')
      setProcessing(null)

      if (adminId) {
        supabase.from('messages').insert({
          sender_id: adminId,
          receiver_id: modal.user_id,
          listing_id: modal.id,
          content: `❌ "${modal.title}" adlı elanınız rədd edildi.${reason ? ` Səbəb: ${reason}` : ''}`,
          is_support: true,
        })
      }

      supabase.from('profiles')
        .select('full_name')
        .eq('id', modal.user_id)
        .single()
        .then(({ data: userData }) => {
          supabase.functions.invoke('send-rejection-email', {
            body: {
              user_id: modal.user_id,
              name: userData?.full_name,
              title: modal.title,
              reason: reason || null,
            },
          })
        })
    } else {
      setProcessing(null)
      setRejectModal(null)
      setRejectReason('')
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0A2342]">
          Moderasiya
          {listings.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full">{listings.length}</span>
          )}
        </h2>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0A2342] px-3 py-1.5 border border-gray-200 rounded-lg">
          Yenilə
        </button>
      </div>
      {error && <ErrorBanner msg={error} />}
      {listings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Check size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-gray-500">Moderasiya gözləyən elan yoxdur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map(l => {
            const seller = l.profiles
            const img = Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null
            return (
              <div key={l.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {img
                    ? <img src={img} alt={l.title} className="w-full h-full object-cover" />
                    : <span className="text-4xl">🖼️</span>
                  }
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <Link to={`/listings/${l.id}`} target="_blank" className="font-semibold text-[#0A2342] hover:text-blue-600 line-clamp-2 leading-snug block">
                      {l.title || '(başlıqsız)'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{l.category}</span>
                      {l.city && <span className="text-xs text-gray-400">📍 {l.city}</span>}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3 text-sm">
                    <p className="font-medium text-[#0A2342]">{seller?.full_name || seller?.company_name || '—'}</p>
                    {seller?.phone && <p className="text-gray-500 text-xs mt-0.5">{seller.phone}</p>}
                    <p className="text-gray-400 text-xs mt-0.5">{shortDate(l.created_at)}</p>
                  </div>
                  <div className="flex gap-2 mt-auto pt-1">
                    <button
                      onClick={() => handleApprove(l)}
                      disabled={processing === l.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Check size={14} /> Təsdiqlə
                    </button>
                    <button
                      onClick={() => { setRejectModal(l); setRejectReason('') }}
                      disabled={processing === l.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-200"
                    >
                      <XCircle size={14} /> Rədd et
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0A2342]">Elanı rədd et</h3>
              <button onClick={() => setRejectModal(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              <span className="font-semibold">"{rejectModal.title}"</span> elanı rədd ediləcək. Satıcıya avtomatik bildiriş göndəriləcək.
            </p>
            <label className="block text-sm font-medium text-[#0A2342] mb-1.5">Rədd etmə səbəbi (isteğe bağlı)</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Məs: Qiymət göstərilməyib, şəkil keyfiyyətsizdir..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Ləğv et</button>
              <button onClick={handleRejectConfirm} disabled={processing === rejectModal.id}
                className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                <XCircle size={14} /> Rədd et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Tab 3: Listings ───────────────────────────────────── */
function ListingsTab({ adminId }) {
  const [listings, setListings]       = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTitle, setSearchTitle] = useState('')
  const [searchCat, setSearchCat]     = useState('')
  const [searchCity, setSearchCity]   = useState('')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [viewModal, setViewModal]     = useState(null)
  const [msgTarget, setMsgTarget]     = useState(null)
  const [cats, setCats]               = useState([])
  const [allSubs, setAllSubs]         = useState([])
  const [editCat, setEditCat]         = useState('')
  const [editSub, setEditSub]         = useState('')
  const [catSaving, setCatSaving]     = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('listings')
          .select('id, title, category, subcategory, status, city, created_at, user_id, images, description, keywords, price, profiles!left(id, full_name, company_name)')
          .not('status', 'eq', 'deleted')
          .order('created_at', { ascending: false })
          .limit(300)
        if (err) throw err
        const items = data || []
        const ids = items.map(l => l.id)
        const [viewsRes, favsRes, clicksRes] = await Promise.all([
          ids.length ? supabase.from('listing_views').select('listing_id').in('listing_id', ids) : { data: [] },
          ids.length ? supabase.from('favorites').select('listing_id').in('listing_id', ids)     : { data: [] },
          ids.length ? supabase.from('phone_clicks').select('listing_id').in('listing_id', ids)  : { data: [] },
        ])
        const vc = {}, fc = {}, pc = {}
        ;(viewsRes.data  || []).forEach(v => { vc[v.listing_id] = (vc[v.listing_id] || 0) + 1 })
        ;(favsRes.data   || []).forEach(f => { fc[f.listing_id] = (fc[f.listing_id] || 0) + 1 })
        ;(clicksRes.data || []).forEach(c => { pc[c.listing_id] = (pc[c.listing_id] || 0) + 1 })
        setListings(items.map(l => ({ ...l, views: vc[l.id] || 0, favorites: fc[l.id] || 0, phoneClicks: pc[l.id] || 0 })))
        const [{ data: catData }, { data: subData }] = await Promise.all([
          supabase.from('categories').select('id, label').eq('is_active', true).order('sort_order'),
          supabase.from('subcategories').select('id, label, category_id').eq('is_active', true).order('sort_order'),
        ])
        setCats(catData || [])
        setAllSubs(subData || [])
      } catch (e) {
        setError('Elanlar yüklənərkən xəta: ' + (e.message || ''))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function changeStatus(id, next) {
    if (next === 'deleted') {
      if (!window.confirm('Bu elanı silmək istədiyinizə əminsiniz?')) return
    }
    const { error } = await supabase.from('listings').update({ status: next }).eq('id', id)
    if (!error) {
      if (next === 'deleted') {
        setListings(ls => ls.filter(l => l.id !== id))
      } else {
        setListings(ls => ls.map(l => l.id === id ? { ...l, status: next } : l))
      }
    }
  }

  function handleExport() {
    exportCSV(filtered.map(l => ({
      id: l.id,
      başlıq: l.title,
      kateqoriya: l.category,
      status: l.status,
      şəhər: l.city,
      sahibi: l.profiles?.full_name || l.profiles?.company_name || '',
      baxış: l.views,
      bəyənmə: l.favorites,
      tel_klik: l.phoneClicks,
      tarix: shortDate(l.created_at),
    })), 'elanlar.csv')
  }

  const STATUS_OPTS = ['active', 'pending', 'rejected', 'deleted']
  const filtered = listings.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (searchTitle && !l.title?.toLowerCase().includes(searchTitle.toLowerCase())) return false
    if (searchCat  && !l.category?.toLowerCase().includes(searchCat.toLowerCase())) return false
    if (searchCity && !l.city?.toLowerCase().includes(searchCity.toLowerCase())) return false
    return true
  })
  const pendingCount = listings.filter(l => l.status === 'pending').length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-[#0A2342]">
          Elanlar
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full">{pendingCount}</span>
          )}
        </h2>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
          <Download size={13} /> CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'active', 'pending', 'rejected', 'deleted'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === s
                ? s === 'pending' ? 'bg-amber-500 text-white' : 'bg-[#0A2342] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s === 'all' ? 'Hamısı' : s}{s === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchTitle} onChange={e => setSearchTitle(e.target.value)}
            placeholder="Başlıq axtar..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 w-44" />
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchCat} onChange={e => setSearchCat(e.target.value)}
            placeholder="Kateqoriya..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 w-36" />
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchCity} onChange={e => setSearchCity(e.target.value)}
            placeholder="Şəhər..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 w-32" />
        </div>
        <span className="text-xs text-gray-400 self-center">{filtered.length} nəticə</span>
      </div>

      {error && <ErrorBanner msg={error} />}
      {loading ? <Spinner /> : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Başlıq', 'Kateqoriya', 'Sahibi', 'Şəhər', 'Baxış', 'Fav', 'Tel', 'Status', 'Tarix', ''].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(l => (
                <tr key={l.id} className={`hover:bg-gray-50 ${l.status === 'pending' ? 'bg-amber-50/60' : ''}`}>
                  <td className="px-3 py-3 font-medium text-[#0A2342] max-w-[160px] truncate">
                    <button onClick={() => { setViewModal(l); setEditCat(l.category || ''); setEditSub(l.subcategory || '') }} className="hover:text-blue-600 text-left w-full truncate">{l.title || '—'}</button>
                  </td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{l.category}</td>
                  <td className="px-3 py-3 text-gray-500 max-w-[110px] truncate">{l.profiles?.full_name || l.profiles?.company_name || '—'}</td>
                  <td className="px-3 py-3 text-gray-500">{l.city || '—'}</td>
                  <td className="px-3 py-3"><span className="text-xs text-gray-600 flex items-center gap-1"><Eye size={11} className="text-gray-400" /> {l.views}</span></td>
                  <td className="px-3 py-3"><span className="text-xs text-gray-600 flex items-center gap-1"><Heart size={11} className="text-gray-400" /> {l.favorites}</span></td>
                  <td className="px-3 py-3"><span className="text-xs text-gray-600 flex items-center gap-1"><Phone size={11} className="text-gray-400" /> {l.phoneClicks}</span></td>
                  <td className="px-3 py-3">
                    <select value={l.status} onChange={e => changeStatus(l.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none ${statusColor(l.status)}`}>
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{shortDate(l.created_at)}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => setMsgTarget({ userId: l.user_id, name: l.profiles?.full_name || l.profiles?.company_name || 'İstifadəçi' })}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 whitespace-nowrap">
                      <MessageSquare size={11} /> Mesaj
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View listing modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-bold text-[#0A2342] truncate pr-4">{viewModal.title}</h3>
              <button onClick={() => setViewModal(null)} className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {Array.isArray(viewModal.images) && viewModal.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {viewModal.images.map((src, i) => (
                    <img key={i} src={src} alt={`img-${i}`}
                      className="w-36 h-28 object-cover rounded-xl flex-shrink-0 border border-gray-200" />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Kateqoriya</p>
                  <select value={editCat} onChange={e => { setEditCat(e.target.value); setEditSub('') }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                    <option value="">—</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Alt kateqoriya</p>
                  <select value={editSub} onChange={e => setEditSub(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                    <option value="">—</option>
                    {allSubs.filter(s => s.category_id === editCat).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div><p className="text-xs text-gray-400 mb-0.5">Status</p><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(viewModal.status)}`}>{viewModal.status}</span></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Şəhər</p><p className="font-medium">{viewModal.city || '—'}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Qiymət</p><p className="font-medium">{viewModal.price ? `${viewModal.price} ₼` : '—'}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Sahibi</p><p className="font-medium">{viewModal.profiles?.full_name || viewModal.profiles?.company_name || '—'}</p></div>
                <div><p className="text-xs text-gray-400 mb-0.5">Tarix</p><p className="font-medium">{shortDate(viewModal.created_at)}</p></div>
              </div>
              {viewModal.description && (
                <div><p className="text-xs text-gray-400 mb-1">Təsvir</p><p className="text-sm text-gray-700 leading-relaxed">{viewModal.description}</p></div>
              )}
              {viewModal.keywords && (
                <div><p className="text-xs text-gray-400 mb-1">Açar sözlər</p><p className="text-sm text-gray-700">{viewModal.keywords}</p></div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between">
              <Link to={`/listings/${viewModal.id}`} target="_blank"
                className="text-sm text-blue-600 font-semibold hover:underline">
                Saytda aç →
              </Link>
              {(editCat !== viewModal.category || editSub !== (viewModal.subcategory || '')) && (
                <button
                  disabled={catSaving || !editCat}
                  onClick={async () => {
                    setCatSaving(true)
                    const { error } = await supabase.from('listings').update({ category: editCat, subcategory: editSub || null }).eq('id', viewModal.id)
                    if (!error) {
                      const updated = { ...viewModal, category: editCat, subcategory: editSub || null }
                      setViewModal(updated)
                      setListings(ls => ls.map(l => l.id === viewModal.id ? { ...l, category: editCat, subcategory: editSub || null } : l))
                    }
                    setCatSaving(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {catSaving ? 'Saxlanılır...' : 'Yadda saxla'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {msgTarget && (
        <SendMsgModal receiverId={msgTarget.userId} senderId={adminId}
          receiverName={msgTarget.name} onClose={() => setMsgTarget(null)} />
      )}
    </div>
  )
}

/* ─── Tab 4: Users ──────────────────────────────────────── */
function UsersTab({ adminId }) {
  const [users, setUsers]           = useState([])
  const [listingCounts, setListingCounts] = useState({})
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [searchQ, setSearchQ]       = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expanded, setExpanded]     = useState(null)
  const [userListings, setUserListings] = useState({})
  const [msgTarget, setMsgTarget]   = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: profileData, error: err } = await supabase
          .from('admin_users')
          .select('id, full_name, company_name, email, phone, city, account_type, is_blocked, created_at')
          .order('created_at', { ascending: false })
        if (err) { setError('Supabase xətası: ' + err.message); setLoading(false); return }
        setUsers(profileData || [])
        const { data: lData, error: lErr } = await supabase
          .from('listings').select('user_id').eq('status', 'active')
        if (!lErr) {
          const counts = {}
          ;(lData || []).forEach(r => { counts[r.user_id] = (counts[r.user_id] || 0) + 1 })
          setListingCounts(counts)
        }
      } catch (e) {
        setError('İstifadəçilər yüklənərkən xəta: ' + (e.message || String(e)))
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

  async function handleDeleteUser(uid, name) {
    if (!window.confirm(`"${name}" istifadəçisini tamamilə silmək istədiyinizə əminsiniz? Bu əməliyyat geri alına bilməz.`)) return

    const { error } = await supabase.from('profiles').delete().eq('id', uid)
    if (error) { alert('Xəta: ' + error.message); return }

    const { error: authError } = await supabase.functions.invoke('delete-user', {
      body: { user_id: uid }
    })

    setUsers(us => us.filter(u => u.id !== uid))
    if (authError) console.warn('Auth delete failed:', authError)
  }

  async function expandUser(uid) {
    if (expanded === uid) { setExpanded(null); return }
    setExpanded(uid)
    if (!userListings[uid]) {
      const { data } = await supabase
        .from('listings')
        .select('id, title, status, created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10)
      setUserListings(ul => ({ ...ul, [uid]: data || [] }))
    }
  }

  function handleExport() {
    exportCSV(filtered.map(u => ({
      id: u.id,
      ad: u.full_name || u.company_name || '',
      email: u.email || '',
      telefon: u.phone || '',
      şəhər: u.city || '',
      növ: u.account_type || '',
      elan_sayı: listingCounts[u.id] || 0,
      status: u.is_blocked ? 'Blok' : 'Aktiv',
      qeydiyyat: shortDate(u.created_at),
    })), 'istifadeciler.csv')
  }

  const filtered = users.filter(u => {
    if (typeFilter === 'individual' && u.account_type !== 'individual') return false
    if (typeFilter === 'supplier'   && u.account_type !== 'supplier')   return false
    if (typeFilter === 'blocked'    && !u.is_blocked)                   return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      const name = (u.full_name || u.company_name || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const phone = (u.phone || '').toLowerCase()
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false
    }
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-[#0A2342]">İstifadəçilər</h2>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
          <Download size={13} /> CSV
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[['all','Hamısı'],['individual','Fərdi'],['supplier','Təchizatçı'],['blocked','Bloklu']].map(([v, l]) => (
          <button key={v} onClick={() => setTypeFilter(v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              typeFilter === v ? 'bg-[#0A2342] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{l}</button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Ad, email, telefon..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 w-48" />
        </div>
        <span className="text-xs text-gray-400 self-center">{filtered.length} nəticə</span>
      </div>
      {error && <ErrorBanner msg={error} />}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Users size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{searchQ || typeFilter !== 'all' ? 'Axtarış nəticəsi tapılmadı' : 'İstifadəçi yoxdur'}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Ad', 'Email', 'Telefon', 'Şəhər', 'Növ', 'Elan', 'Tarix', 'Status', 'Əməliyyat'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <Fragment key={u.id}>
                  <tr className={`hover:bg-gray-50 cursor-pointer ${u.is_blocked ? 'opacity-60' : ''}`}
                    onClick={() => expandUser(u.id)}>
                    <td className="px-3 py-3 font-medium text-[#0A2342] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {expanded === u.id ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                        {u.full_name || u.company_name || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-500 max-w-[160px] truncate">{u.email || '—'}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{u.phone || '—'}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{u.city || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.account_type === 'supplier' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>{u.account_type || 'fərdi'}</span>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-gray-700">{listingCounts[u.id] || 0}</td>
                    <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">{shortDate(u.created_at)}</td>
                    <td className="px-3 py-3">
                      {u.is_blocked
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Blok</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Aktiv</span>
                      }
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => toggleBlock(u.id, u.is_blocked)}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
                            u.is_blocked ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}>
                          {u.is_blocked ? <><ShieldOff size={11} /> Açıq</> : <><Shield size={11} /> Blok</>}
                        </button>
                        <button onClick={() => setMsgTarget({ id: u.id, name: u.full_name || u.company_name || u.email })}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <MessageSquare size={11} /> Mesaj
                        </button>
                        <button onClick={() => handleDeleteUser(u.id, u.full_name || u.company_name || u.email)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                          <Trash2 size={11} /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === u.id && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Son elanlar:</p>
                        {userListings[u.id] === undefined ? (
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : userListings[u.id].length === 0 ? (
                          <p className="text-xs text-gray-400">Elan yoxdur</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {userListings[u.id].map(l => (
                              <Link key={l.id} to={`/listings/${l.id}`} target="_blank"
                                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  l.status === 'active' ? 'bg-green-500' : l.status === 'pending' ? 'bg-amber-500' : 'bg-red-400'
                                }`} />
                                {l.title || '(başlıqsız)'}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {msgTarget && (
        <SendMsgModal receiverId={msgTarget.id} senderId={adminId}
          receiverName={msgTarget.name} onClose={() => setMsgTarget(null)} />
      )}
    </div>
  )
}

/* ─── Tab 5: Support ────────────────────────────────────── */
function SupportTab({ adminId }) {
  const [convs, setConvs]       = useState([])
  const [profiles, setProfiles] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [reply, setReply]       = useState('')
  const [sending, setSending]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const threadRef = useRef(null)

  const loadRef = useRef(null)

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const { data: msgs, error: err } = await supabase
          .from('messages').select('*').is('listing_id', null)
          .order('created_at', { ascending: true })
        if (err) { setError('Supabase xətası: ' + err.message); setLoading(false); return }
        if (!msgs?.length) { setConvs([]); setLoading(false); return }
        const map = {}
        for (const m of msgs) {
          const otherId = m.sender_id === adminId ? m.receiver_id : m.sender_id
          if (!map[otherId]) map[otherId] = { userId: otherId, messages: [], unread: 0 }
          map[otherId].messages.push(m)
          if (m.receiver_id === adminId && !m.is_read) map[otherId].unread++
        }
        const list = Object.values(map).sort((a, b) =>
          new Date(b.messages.at(-1).created_at) - new Date(a.messages.at(-1).created_at))
        setConvs(list)
        const ids = list.map(c => c.userId)
        if (ids.length) {
          const { data: pData } = await supabase.from('profiles')
            .select('id, full_name, company_name, email').in('id', ids)
          const pm = {}
          ;(pData || []).forEach(p => { pm[p.id] = p })
          setProfiles(pm)
        }
      } catch (e) {
        setError('Support mesajları yüklənərkən xəta: ' + (e.message || String(e)))
      } finally {
        setLoading(false)
      }
    }
    loadRef.current = load
    load()
  }, [adminId])
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [activeId, convs])

  async function markRead(userId) {
    await supabase.from('messages').update({ is_read: true })
      .is('listing_id', null).eq('sender_id', userId).eq('receiver_id', adminId).eq('is_read', false)
    setConvs(cs => cs.map(c => c.userId === userId ? { ...c, unread: 0 } : c))
  }

  function openConv(userId) { setActiveId(userId); markRead(userId) }

  async function sendReply() {
    if (!reply.trim() || !activeId) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      sender_id: adminId, receiver_id: activeId,
      listing_id: null, content: reply.trim(),
    })
    if (!error) { setReply(''); await loadRef.current?.() }
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
          <div className={`w-72 flex-shrink-0 border-r border-gray-200 overflow-y-auto ${activeId ? 'hidden sm:block' : 'block'}`}>
            {convs.map(c => (
              <button key={c.userId} onClick={() => openConv(c.userId)}
                className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  activeId === c.userId ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : ''
                }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-[#0A2342] truncate">{displayName(c.userId)}</span>
                  {c.unread > 0 && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unread}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{c.messages.at(-1)?.content}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{timeStr(c.messages.at(-1)?.created_at)}</p>
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Sol tərəfdən söhbət seçin</div>
            ) : (
              <>
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                  <button className="sm:hidden p-1 text-gray-500" onClick={() => setActiveId(null)}><ChevronLeft size={18} /></button>
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
                          <p className={`text-[10px] mt-1 ${mine ? 'text-blue-200' : 'text-gray-400'}`}>{timeStr(m.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="p-3 border-t border-gray-100 flex-shrink-0">
                  <div className="flex gap-2">
                    <textarea value={reply} onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                      placeholder="Cavab yazın... (Enter ilə göndər)" rows={2}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
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

/* ─── Tab 6: Analytics ──────────────────────────────────── */
function AnalyticsTab() {
  const [period, setPeriod]   = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [regChart, setRegChart]     = useState([])
  const [listChart, setListChart]   = useState([])
  const [catViewData, setCatViewData] = useState([])
  const [cityData, setCityData]     = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const cutoff = daysAgo(period)
        const [regRes, listRes, viewsRes, citiesRes] = await Promise.all([
          supabase.from('profiles').select('created_at').gte('created_at', cutoff),
          supabase.from('listings').select('created_at').gte('created_at', cutoff),
          supabase.from('listing_views').select('listing_id, created_at').gte('created_at', cutoff),
          supabase.from('listings').select('city').eq('status', 'active'),
        ])

        const regLabels  = buildDayLabels(period)
        const listLabels = buildDayLabels(period)
        ;(regRes.data  || []).forEach(r => {
          const k = new Date(r.created_at).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' })
          if (k in regLabels) regLabels[k]++
        })
        ;(listRes.data || []).forEach(r => {
          const k = new Date(r.created_at).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' })
          if (k in listLabels) listLabels[k]++
        })
        setRegChart(Object.entries(regLabels).map(([date, count]) => ({ date, count })))
        setListChart(Object.entries(listLabels).map(([date, count]) => ({ date, count })))

        // Category views
        const viewListingIds = [...new Set((viewsRes.data || []).map(v => v.listing_id))]
        if (viewListingIds.length > 0) {
          const { data: lCats } = await supabase
            .from('listings').select('id, category').in('id', viewListingIds.slice(0, 500))
          const catMap = {}
          ;(lCats || []).forEach(l => { catMap[l.id] = l.category })
          const catCounts = {}
          ;(viewsRes.data || []).forEach(v => {
            const cat = catMap[v.listing_id]
            if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1
          })
          setCatViewData(Object.entries(catCounts).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name, value]) => ({ name, value })))
        }

        // City distribution
        const cityCounts = {}
        ;(citiesRes.data || []).forEach(r => {
          if (r.city) cityCounts[r.city] = (cityCounts[r.city] || 0) + 1
        })
        setCityData(Object.entries(cityCounts).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name, count]) => ({ name, count })))
      } catch (e) {
        setError('Analitika yüklənərkən xəta: ' + (e.message || ''))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0A2342]">Analitika</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                period === d ? 'bg-[#0A2342] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>Son {d} gün</button>
          ))}
        </div>
      </div>
      {error && <ErrorBanner msg={error} />}
      {loading ? <Spinner /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[#0A2342] mb-4">Günlük qeydiyyat</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(period / 7)} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[3,3,0,0]} name="Qeydiyyat" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[#0A2342] mb-4">Günlük yeni elanlar</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={listChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={Math.floor(period / 7)} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[3,3,0,0]} name="Elan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {catViewData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-[#0A2342] mb-4">Kateqoriya üzrə baxışlar</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={catViewData} layout="vertical" margin={{ top: 0, right: 16, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0,3,3,0]} name="Baxış" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {cityData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-[#0A2342] mb-4">Ən aktiv şəhərlər (aktiv elanlar)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 16, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0,3,3,0]} name="Elan" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Tab 7: Settings ───────────────────────────────────── */
function SettingsTab() {
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    maintenance_message: '',
    admin_email: '',
    site_about: '',
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('site_settings').select('*').eq('id', 'main').maybeSingle()
      if (!err && data) {
        setSettings({
          maintenance_mode:    data.maintenance_mode    ?? false,
          maintenance_message: data.maintenance_message ?? '',
          admin_email:         data.admin_email         ?? '',
          site_about:          data.site_about          ?? '',
        })
      } else if (err && !err.message?.includes('does not exist')) {
        setError('Ayarlar yüklənərkən xəta: ' + err.message)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false)
    const { error: err } = await supabase
      .from('site_settings')
      .upsert({ id: 'main', ...settings }, { onConflict: 'id' })
    if (err) {
      setError('Saxlanıla bilmədi: ' + err.message + '. site_settings cədvəlini yaratmaq lazım ola bilər.')
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  function set(k, v) { setSettings(s => ({ ...s, [k]: v })) }

  if (loading) return <Spinner />

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-xl font-bold text-[#0A2342]">Sistem ayarları</h2>
      {error && <ErrorBanner msg={error} />}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle2 size={16} /> Ayarlar saxlanıldı
        </div>
      )}

      {/* Maintenance mode */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#0A2342]">Texniki iş rejimi</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Texniki iş rejimi</p>
            <p className="text-xs text-gray-400 mt-0.5">Aktiv olanda istifadəçilər aşağıdakı mesajı görür</p>
          </div>
          <button
            onClick={() => set('maintenance_mode', !settings.maintenance_mode)}
            className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-orange-500' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Texniki iş mesajı</label>
          <textarea
            value={settings.maintenance_message}
            onChange={e => set('maintenance_message', e.target.value)}
            placeholder="Məs: Sayt texniki işlər üçün müvəqqəti bağlıdır. Tezliklə qayıdacağıq."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Admin email */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#0A2342]">Bildiriş parametrləri</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin bildiriş emaili</label>
          <input
            type="email"
            value={settings.admin_email}
            onChange={e => set('admin_email', e.target.value)}
            placeholder="admin@horecahub.az"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Site about */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#0A2342]">Sayt haqqında</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Qısa məlumat</label>
          <textarea
            value={settings.site_about}
            onChange={e => set('site_about', e.target.value)}
            placeholder="HorecaHub.az haqqında qısa məlumat..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-[#0A2342] text-white font-bold rounded-xl hover:bg-[#0d2d57] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
        {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saxlanılır...</> : 'Ayarları saxla'}
      </button>
    </div>
  )
}

/* ─── Categories Tab ───────────────────────────────────── */
function CategoriesTab() {
  const [cats, setCats] = useState([])
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState(null)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: s }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
    ])
    setCats(c || [])
    setSubs(s || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleCat(id, val) {
    await supabase.from('categories').update({ is_active: !val }).eq('id', id)
    setCats(prev => prev.map(x => x.id === id ? { ...x, is_active: !val } : x))
  }
  async function toggleSub(id, val) {
    await supabase.from('subcategories').update({ is_active: !val }).eq('id', id)
    setSubs(prev => prev.map(x => x.id === id ? { ...x, is_active: !val } : x))
  }
  async function deleteCat(id) {
    if (!window.confirm('Kateqoriyanı silmək istədiyinizə əminsiniz? Alt kateqoriyalar da silinəcək.')) return
    await supabase.from('subcategories').delete().eq('category_id', id)
    await supabase.from('categories').delete().eq('id', id)
    setCats(prev => prev.filter(x => x.id !== id))
    setSubs(prev => prev.filter(x => x.category_id !== id))
    if (selectedCat === id) setSelectedCat(null)
  }
  async function deleteSub(id) {
    if (!window.confirm('Alt kateqoriyanı silmək istədiyinizə əminsiniz?')) return
    await supabase.from('subcategories').delete().eq('id', id)
    setSubs(prev => prev.filter(x => x.id !== id))
  }

  async function saveModal() {
    if (!modal) return
    setSaving(true)
    const { mode, data } = modal
    if (mode === 'cat_add') {
      const { error } = await supabase.from('categories').insert({
        id: data.id, key: `cat.${data.id}`, label: data.label,
        icon: data.icon || '', sort_order: Number(data.sort_order) || 99, is_active: true,
      })
      if (!error) { await load(); setModal(null) }
    } else if (mode === 'cat_edit') {
      const { error } = await supabase.from('categories').update({
        label: data.label, icon: data.icon || '', sort_order: Number(data.sort_order) || 0,
      }).eq('id', data.id)
      if (!error) { await load(); setModal(null) }
    } else if (mode === 'sub_add') {
      const { error } = await supabase.from('subcategories').insert({
        id: data.id, category_id: data.category_id,
        key: `subcat.${data.id}`, label: data.label,
        sort_order: Number(data.sort_order) || 99, is_active: true,
      })
      if (!error) { await load(); setModal(null) }
    } else if (mode === 'sub_edit') {
      const { error } = await supabase.from('subcategories').update({
        label: data.label, sort_order: Number(data.sort_order) || 0,
      }).eq('id', data.id)
      if (!error) { await load(); setModal(null) }
    }
    setSaving(false)
  }

  const catSubs = subs.filter(s => s.category_id === selectedCat)

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0A2342]">Kateqoriyalar</h2>
        <button
          onClick={() => setModal({ mode: 'cat_add', data: { id: '', label: '', icon: '', sort_order: '' } })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
        >
          <Tag size={14} /> Yeni kateqoriya
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Adı</th>
              <th className="px-4 py-3 text-left">İkon</th>
              <th className="px-4 py-3 text-center">Sıra</th>
              <th className="px-4 py-3 text-center">Aktiv</th>
              <th className="px-4 py-3 text-center">Əməliyyat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cats.map(cat => (
              <tr
                key={cat.id}
                onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
                className={`hover:bg-gray-50 cursor-pointer ${selectedCat === cat.id ? 'bg-blue-50' : ''}`}
              >
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{cat.label}</td>
                <td className="px-4 py-3 text-gray-500">{cat.icon}</td>
                <td className="px-4 py-3 text-center text-gray-500">{cat.sort_order}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={e => { e.stopPropagation(); toggleCat(cat.id, cat.is_active) }}
                    className={`w-9 h-5 rounded-full transition-colors relative ${cat.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cat.is_active ? 'translate-x-4' : ''}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setModal({ mode: 'cat_edit', data: { ...cat } })}
                      className="text-xs text-blue-600 hover:underline">Düzəlt</button>
                    <button onClick={() => deleteCat(cat.id)}
                      className="text-xs text-red-500 hover:underline">Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCat && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0A2342]">
              Alt kateqoriyalar — <span className="text-blue-600">{selectedCat}</span>
            </h3>
            <button
              onClick={() => setModal({ mode: 'sub_add', data: { id: '', label: '', sort_order: '', category_id: selectedCat } })}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
            >
              <Tag size={12} /> Yeni alt kateqoriya
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Adı</th>
                  <th className="px-4 py-3 text-center">Sıra</th>
                  <th className="px-4 py-3 text-center">Aktiv</th>
                  <th className="px-4 py-3 text-center">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {catSubs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Alt kateqoriya yoxdur</td></tr>
                ) : catSubs.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{sub.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{sub.label}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{sub.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleSub(sub.id, sub.is_active)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${sub.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sub.is_active ? 'translate-x-4' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setModal({ mode: 'sub_edit', data: { ...sub } })}
                          className="text-xs text-blue-600 hover:underline">Düzəlt</button>
                        <button onClick={() => deleteSub(sub.id)}
                          className="text-xs text-red-500 hover:underline">Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#0A2342]">
                {modal.mode === 'cat_add' && 'Yeni kateqoriya'}
                {modal.mode === 'cat_edit' && 'Kateqoriyanı düzəlt'}
                {modal.mode === 'sub_add' && 'Yeni alt kateqoriya'}
                {modal.mode === 'sub_edit' && 'Alt kateqoriyanı düzəlt'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {(modal.mode === 'cat_add' || modal.mode === 'sub_add') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ID (sonradan dəyişdirilə bilməz)</label>
                  <input
                    value={modal.data.id}
                    onChange={e => setModal(m => ({ ...m, data: { ...m.data, id: e.target.value } }))}
                    placeholder="məs: new_category"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ad</label>
                <input
                  value={modal.data.label}
                  onChange={e => setModal(m => ({ ...m, data: { ...m.data, label: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              {(modal.mode === 'cat_add' || modal.mode === 'cat_edit') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">İkon adı (lucide-react)</label>
                  <input
                    value={modal.data.icon || ''}
                    onChange={e => setModal(m => ({ ...m, data: { ...m.data, icon: e.target.value } }))}
                    placeholder="məs: Coffee"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sıra nömrəsi</label>
                <input
                  type="number"
                  value={modal.data.sort_order}
                  onChange={e => setModal(m => ({ ...m, data: { ...m.data, sort_order: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">Ləğv et</button>
              <button
                onClick={saveModal}
                disabled={saving || !modal.data.label}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saxlanılır...' : 'Saxla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── FeedbackTab ───────────────────────────────────────── */
function FeedbackTab({ onView }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    async function markAllRead() {
      await supabase.from('feedback').update({ is_read: true }).eq('is_read', false)
      onView?.()
    }
    markAllRead()
  }, [])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, user_id, type, message, context, created_at, is_read')
        .order('created_at', { ascending: false })

      if (error) { setLoading(false); return }

      if (data && data.length > 0) {
        const userIds = [...new Set(data.filter(f => f.user_id).map(f => f.user_id))]
        let profileMap = {}
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, company_name')
            .in('id', userIds)
          ;(profileData || []).forEach(p => { profileMap[p.id] = p })
        }
        setItems(data.map(f => ({ ...f, profiles: profileMap[f.user_id] || null })))
      } else {
        setItems([])
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = typeFilter === 'all' ? items : items.filter(f => f.type === typeFilter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#0A2342]">
          Rəylər
          {items.length > 0 && <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">{items.length}</span>}
        </h2>
      </div>

      <div className="flex gap-2 mb-4">
        {[['all','Hamısı'],['suggestion','Təkliflər'],['problem','Problemlər']].map(([v,l]) => (
          <button key={v} onClick={() => setTypeFilter(v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${typeFilter === v ? 'bg-[#0A2342] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <MessageCircle size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Hələ rəy yoxdur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.type === 'suggestion' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                    {f.type === 'suggestion' ? '💡 Təklif' : '⚠️ Problem'}
                  </span>
                  <span className="text-xs text-gray-400">{f.context}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 whitespace-nowrap">{shortDate(f.created_at)}</span>
                  <button
                    onClick={async () => {
                      await supabase.from('feedback').delete().eq('id', f.id)
                      setItems(prev => prev.filter(item => item.id !== f.id))
                    }}
                    className="text-xs text-red-400 hover:text-red-600 ml-auto"
                  >
                    Sil
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">{f.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {f.profiles?.full_name || f.profiles?.company_name || 'Anonim'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Main Admin ────────────────────────────────────────── */
const TABS = [
  { id: 'dashboard',  label: 'Ümumi',        icon: LayoutDashboard },
  { id: 'moderation', label: 'Moderasiya',    icon: CheckCircle2 },
  { id: 'listings',   label: 'Elanlar',       icon: List },
  { id: 'users',      label: 'İstifadəçilər', icon: Users },
  { id: 'support',    label: 'Support',       icon: MessageSquare },
  { id: 'analytics',   label: 'Analitika',      icon: BarChart2 },
  { id: 'categories', label: 'Kateqoriyalar', icon: Tag },
  { id: 'feedback',   label: 'Rəylər',        icon: MessageCircle },
  { id: 'settings',   label: 'Ayarlar',       icon: Settings },
]

export default function Admin() {
  const { signOut } = useAuth()
  const [isAdmin, setIsAdmin]           = useState(null)
  const [adminId, setAdminId]           = useState(null)
  const [tab, setTab]                   = useState('dashboard')
  const [supportBadge, setSupportBadge]   = useState(0)
  const [pendingBadge, setPendingBadge]   = useState(0)
  const [feedbackBadge, setFeedbackBadge] = useState(0)
  const [realtimeEvents, setRealtimeEvents] = useState([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session?.user) { setIsAdmin(false); return }
      const uid = session.user.id
      const { data, error } = await supabase
        .from('profiles').select('is_admin').eq('id', uid).maybeSingle()
      if (cancelled) return
      if (error) return
      if (data?.is_admin) { setAdminId(uid); setIsAdmin(true) }
      else setIsAdmin(false)
    })()
    return () => { cancelled = true }
  }, [])

  function addEvent(type, title) {
    setRealtimeEvents(prev => [
      { type, title, time: new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }) },
      ...prev.slice(0, 9),
    ])
  }

  useEffect(() => {
    if (!adminId) return
    supabase.from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_support', true).eq('receiver_id', adminId).eq('is_read', false)
      .then(({ count }) => setSupportBadge(count || 0))
    supabase.from('listings')
      .select('*', { count: 'exact', head: true }).eq('status', 'pending')
      .then(({ count }) => setPendingBadge(count || 0))
    supabase.from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }) => setFeedbackBadge(count || 0))
  }, [adminId])

  useEffect(() => {
    if (!adminId) return
    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, payload => {
        if (payload.new?.status === 'pending') {
          setPendingBadge(n => n + 1)
          addEvent('pending', `Yeni elan moderasiyada: "${payload.new.title || 'başlıqsız'}"`)
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'listings' }, payload => {
        if (payload.new?.status === 'active' && payload.old?.status === 'pending') {
          setPendingBadge(n => Math.max(0, n - 1))
        }
        if (payload.new?.status === 'pending' && payload.old?.status !== 'pending') {
          setPendingBadge(n => n + 1)
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        if (payload.new?.is_support && payload.new?.receiver_id === adminId) {
          setSupportBadge(n => n + 1)
          addEvent('support', 'Yeni support mesajı alındı')
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
        addEvent('user', `Yeni qeydiyyat: ${payload.new?.full_name || payload.new?.email || 'istifadəçi'}`)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, () => {
        setFeedbackBadge(n => n + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [adminId])

  if (isAdmin === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!isAdmin) return <Navigate to="/" replace />
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0A2342] text-white sticky top-0 z-40">
        <span className="font-bold text-sm">HorecaHub Admin</span>
        <button onClick={() => setMobileSidebarOpen(true)} className="p-1">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#0A2342] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <span className="text-white font-bold">Admin Panel</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-3">
              {TABS.map(t => {
                const Icon = t.icon
                const badge = t.id === 'support'    ? supportBadge :
                              t.id === 'moderation' ? pendingBadge :
                              t.id === 'listings'   ? pendingBadge :
                              t.id === 'feedback'   ? feedbackBadge : 0
                const badgeColor = t.id === 'moderation' || t.id === 'listings' ? 'bg-amber-500' : 'bg-red-500'
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setMobileSidebarOpen(false) }}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      tab === t.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}>
                    <Icon size={16} />
                    {t.label}
                    {badge > 0 && (
                      <span className={`ml-auto w-5 h-5 ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>{badge}</span>
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
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-56 flex-shrink-0 bg-[#0A2342] text-white flex-col">
          <div className="px-5 py-5 border-b border-white/10">
            <Link to="/" className="text-white font-bold text-lg tracking-tight">HorecaHub</Link>
            <p className="text-white/40 text-xs mt-0.5">Admin panel</p>
          </div>
          <nav className="flex-1 py-4 space-y-1 px-3">
            {TABS.map(t => {
              const Icon = t.icon
              const badge = t.id === 'support'    ? supportBadge :
                            t.id === 'moderation' ? pendingBadge :
                            t.id === 'listings'   ? pendingBadge :
                            t.id === 'feedback'   ? feedbackBadge : 0
              const badgeColor = t.id === 'moderation' || t.id === 'listings' ? 'bg-amber-500' : 'bg-red-500'
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === t.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}>
                  <Icon size={16} />
                  {t.label}
                  {badge > 0 && (
                    <span className={`ml-auto w-5 h-5 ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>{badge}</span>
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

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {tab === 'dashboard'  && <DashboardTab  realtimeEvents={realtimeEvents} />}
          {/* ModerationTab stays mounted to prevent re-fetch on tab switch */}
          <div className={tab !== 'moderation' ? 'hidden' : ''}>
            <ModerationTab adminId={adminId} onApprove={() => setPendingBadge(n => Math.max(0, n - 1))} />
          </div>
          <div className={tab !== 'listings' ? 'hidden' : ''}>
            <ListingsTab adminId={adminId} />
          </div>
          {tab === 'users'      && <UsersTab      adminId={adminId} />}
          {tab === 'support'    && <SupportTab    adminId={adminId} />}
          {tab === 'analytics'   && <AnalyticsTab />}
          {tab === 'categories'  && <CategoriesTab />}
          {tab === 'feedback'    && <FeedbackTab onView={() => setFeedbackBadge(0)} />}
          {tab === 'settings'    && <SettingsTab />}
        </main>
      </div>
    </div>
  )
}

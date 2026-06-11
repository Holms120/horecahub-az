import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, ChevronLeft, MessageSquare, Inbox } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import RelativeTime from '../components/RelativeTime'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'

/* ─── pure helpers ────────────────────────────────────────── */

function sellerName(p) {
  if (!p) return i18n.t('messages.unknownUser')
  return p.full_name || p.company_name ||
    (p.email ? p.email.split('@')[0] : i18n.t('messages.unknownUser'))
}

function dayLabel(iso) {
  const d    = new Date(iso)
  const now  = new Date()
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString())  return 'Bu gün'
  if (d.toDateString() === yest.toDateString()) return 'Dünən'
  return d.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })
}

function withDateSeparators(msgs) {
  const out = []; let last = ''
  for (const m of msgs) {
    const d = new Date(m.created_at).toDateString()
    if (d !== last) { out.push({ _sep: true, date: m.created_at }); last = d }
    out.push(m)
  }
  return out
}

function buildConvMap(data, userId) {
  const map = new Map()
  for (const msg of data) {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
    const key     = `${msg.listing_id}::${otherId}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        listingId:    msg.listing_id,
        listingTitle: msg.listings?.title || '',
        otherId,
        messages:     [],
        lastMsg:      msg,
        unreadCount:  0,
      })
    }
    const c = map.get(key)
    c.messages.push(msg)
    c.lastMsg = msg
    if (msg.receiver_id === userId && !msg.is_read) c.unreadCount++
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at)
  )
}

/* ─── component ───────────────────────────────────────────── */

export default function Messages() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [profiles, setProfiles]           = useState({})
  const [messages, setMessages]           = useState([])
  const [activeConv, setActiveConv]       = useState(null)
  const [loadingConvs, setLoadingConvs]   = useState(true)
  const [replyText, setReplyText]         = useState('')
  const [sending, setSending]             = useState(false)
  const [mobileView, setMobileView]       = useState('list')  // 'list' | 'thread'

  const bottomRef     = useRef(null)
  const textareaRef   = useRef(null)
  const activeConvRef = useRef(null)

  useEffect(() => { activeConvRef.current = activeConv }, [activeConv])

  /* auth guard */
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { state: { from: '/messages' } })
  }, [user, authLoading, navigate])

  /* ── load conversations ── */
  const loadConversations = useCallback(async (silent = false) => {
    if (!user) return
    if (!silent) setLoadingConvs(true)

    const { data, error } = await supabase
      .from('messages')
      .select('*, listings(id, title)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    if (!error && data) {
      const convList = buildConvMap(data, user.id)
      setConversations(convList)

      const ids = [...new Set(convList.map(c => c.otherId))]
      if (ids.length) {
        const { data: ps } = await supabase
          .from('profiles').select('id, full_name, company_name, email').in('id', ids)
        if (ps) {
          const map = {}; ps.forEach(p => { map[p.id] = p })
          setProfiles(map)
        }
      }
    }
    if (!silent) setLoadingConvs(false)
  }, [user])

  useEffect(() => { if (user) loadConversations() }, [user, loadConversations])

  /* ── sidebar real-time (any incoming message) ── */
  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('sidebar-unread')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => loadConversations(true))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, loadConversations])

  /* ── per-conversation real-time (active thread) ── */
  useEffect(() => {
    if (!activeConv?.listingId) return

    const listingId = activeConv.listingId
    const otherId   = activeConv.otherId
    const convKey   = activeConv.key

    const ch = supabase.channel(`thread-${listingId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `listing_id=eq.${listingId}`,
      }, (payload) => {
        const msg = payload.new

        // only messages in THIS two-person conversation
        const belongs =
          (msg.sender_id === otherId   && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id   && msg.receiver_id === otherId)
        if (!belongs) return

        setMessages(prev =>
          prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
        )

        // mark incoming as read
        if (msg.receiver_id === user.id) {
          supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
          setConversations(prev => prev.map(c =>
            c.key === convKey ? { ...c, lastMsg: msg, unreadCount: 0 } : c
          ))
        } else {
          // our own message confirmed by server — update lastMsg in sidebar
          setConversations(prev => prev.map(c =>
            c.key === convKey ? { ...c, lastMsg: msg } : c
          ))
        }

        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [activeConv?.listingId, activeConv?.otherId, user?.id])    // eslint-disable-line

  /* ── helpers ── */

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 30)
  }

  function selectConversation(conv) {
    setActiveConv(conv)
    setMessages(conv.messages)
    setMobileView('thread')
    scrollToBottom()
    if (conv.unreadCount > 0) {
      setConversations(prev =>
        prev.map(c => c.key === conv.key ? { ...c, unreadCount: 0 } : c)
      )
      supabase.from('messages').update({ is_read: true })
        .eq('listing_id', conv.listingId)
        .eq('receiver_id', user.id)
        .eq('sender_id', conv.otherId)
        .eq('is_read', false)
    }
  }

  async function sendMessage() {
    const text = replyText.trim()
    if (!text || !activeConv || sending) return
    setSending(true)

    const optId  = `opt-${Date.now()}`
    const optMsg = {
      id: optId, _opt: true,
      listing_id:  activeConv.listingId,
      sender_id:   user.id,
      receiver_id: activeConv.otherId,
      content:     text,
      created_at:  new Date().toISOString(),
    }
    setMessages(prev => [...prev, optMsg])
    setReplyText('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        listing_id:  activeConv.listingId,
        sender_id:   user.id,
        receiver_id: activeConv.otherId,
        content:     text,
      })
      .select()
      .single()

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === optId ? data : m))
      setConversations(prev =>
        prev.map(c => c.key === activeConv.key ? { ...c, lastMsg: data } : c)
      )
    } else {
      setMessages(prev => prev.filter(m => m.id !== optId))
      setReplyText(text)
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* ─── render ──────────────────────────────────────────────── */

  if (authLoading || loadingConvs) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-navy mb-6">{t('messages.title')}</h1>
        <div className="text-center py-24 bg-gray-50 rounded-2xl border border-gray-200">
          <Inbox size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-navy mb-2">{t('messages.empty')}</h3>
          <p className="text-sm text-gray-500 mb-6">{t('messages.emptyDesc')}</p>
          <Link to="/listings"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700">
            {t('messages.browseListings')}
          </Link>
        </div>
      </div>
    )
  }

  const grouped = withDateSeparators(messages)

  return (
    /* Full viewport height minus navbar (64px = 4rem) */
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-white">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`
        w-full sm:w-80 flex-shrink-0
        border-r border-gray-200 flex flex-col bg-white
        ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}
      `}>
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {conversations.length} {t('messages.conversations')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => {
            const other     = profiles[conv.otherId]
            const name      = sellerName(other)
            const isActive  = activeConv?.key === conv.key
            const last      = conv.lastMsg
            const isMine    = last.sender_id === user.id
            const hasUnread = conv.unreadCount > 0

            return (
              <button key={conv.key}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left px-4 py-4 border-b border-gray-100
                  hover:bg-gray-50 transition-colors
                  ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* avatar + badge */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-0.5">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm truncate text-navy ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
                        {name}
                      </span>
                      <RelativeTime dateStr={last.created_at}
                        className="text-xs text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-xs text-blue-600 font-medium truncate mb-0.5">
                      {conv.listingTitle}
                    </p>
                    <p className={`text-xs truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {isMine && <span className="text-gray-400">{t('messages.you')} </span>}
                      {last.content}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Thread panel ─────────────────────────────────────── */}
      <section className={`
        flex-1 flex flex-col min-w-0
        ${mobileView === 'list' && !activeConv ? 'hidden sm:flex' : 'flex'}
      `}>
        {!activeConv ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm font-medium">{t('messages.selectConversation')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
              <button className="sm:hidden p-1 -ml-1 text-gray-500 hover:text-navy"
                onClick={() => { setMobileView('list'); setActiveConv(null) }}>
                <ChevronLeft size={20} />
              </button>
              <div className="min-w-0">
                <p className="font-semibold text-navy text-sm truncate">
                  {sellerName(profiles[activeConv.otherId])}
                </p>
                <Link to={`/listings/${activeConv.listingId}`}
                  className="text-xs text-blue-600 hover:underline truncate block">
                  {activeConv.listingTitle} →
                </Link>
              </div>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {grouped.map((item, i) => {
                if (item._sep) {
                  return (
                    <div key={`sep-${i}`} className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                        {dayLabel(item.date)}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>
                  )
                }

                const mine = item.sender_id === user.id
                return (
                  <div key={item.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      max-w-[75%] px-4 py-2.5 rounded-2xl text-sm
                      ${mine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-navy rounded-bl-sm'}
                      ${item._opt ? 'opacity-60' : ''}
                    `}>
                      <p className="leading-relaxed break-words whitespace-pre-wrap">
                        {item.content}
                      </p>
                      <p className={`text-[11px] mt-1 ${mine ? 'text-blue-200' : 'text-gray-400'}`}>
                        <RelativeTime dateStr={item.created_at} />
                      </p>
                    </div>
                  </div>
                )
              })}

              <div ref={bottomRef} className="h-1" />
            </div>

            {/* Reply input */}
            <div className="flex-shrink-0 border-t border-gray-100 p-3">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  placeholder={t('messages.replyPlaceholder')}
                  rows={2}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                    resize-none disabled:opacity-60"
                />
                <button
                  onClick={sendMessage}
                  disabled={!replyText.trim() || sending}
                  className="w-11 h-11 flex-shrink-0 bg-blue-600 text-white rounded-xl
                    hover:bg-blue-700 disabled:opacity-50 transition-colors
                    flex items-center justify-center"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send size={18} />
                  }
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

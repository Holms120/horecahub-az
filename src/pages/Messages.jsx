import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, ChevronLeft, MessageSquare, Inbox, Trash2, MoreVertical } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import RelativeTime from '../components/RelativeTime'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'

/* ─── helpers ─────────────────────────────────────────────── */

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
        isSupport:    msg.listing_id === null,
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
  const [mobileView, setMobileView]       = useState('list')
  const [otherOnline, setOtherOnline]     = useState(false)
  const [otherTyping, setOtherTyping]     = useState(false)
  const [deletingMsgId, setDeletingMsgId]     = useState(null)
  const [confirmDeleteConv, setConfirmDeleteConv] = useState(null)
  const [openMenuConvKey, setOpenMenuConvKey]     = useState(null)
  const [deletingConv, setDeletingConv]           = useState(false)

  const threadRef       = useRef(null)
  const textareaRef     = useRef(null)
  const activeConvRef   = useRef(null)
  const presenceChanRef = useRef(null)
  const typingTimerRef  = useRef(null)
  const typingActiveRef = useRef(false)

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

      // Aktiv söhbətin unreadCount-unu sıfır saxla
      const activeKey = activeConvRef.current?.key
      const finalList = convList.map(c =>
        c.key === activeKey ? { ...c, unreadCount: 0 } : c
      )
      setConversations(finalList)

      const ids = [...new Set(convList.map(c => c.otherId))]
      if (ids.length) {
        const { data: ps } = await supabase
          .from('profiles').select('id, full_name, company_name, email, is_admin').in('id', ids)
        if (ps) {
          const map = {}; ps.forEach(p => { map[p.id] = p })
          setProfiles(map)
        }
      }
    }
    if (!silent) setLoadingConvs(false)
  }, [user])

  useEffect(() => { if (user) loadConversations() }, [user, loadConversations])

  /* ── sidebar real-time ── */
  useEffect(() => {
    if (!user) return
    const userId = user.id
    const ch = supabase.channel('sidebar-unread')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, (payload) => {
        if (payload.new.receiver_id === userId) loadConversations(true)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
      }, (payload) => {
        if (payload.new.is_read && !payload.old.is_read) {
          setConversations(prev => prev.map(c => {
            const sameConv = c.listingId === payload.new.listing_id ||
              (c.listingId === null && payload.new.listing_id === null)
            if (!sameConv) return c
            return { ...c, unreadCount: Math.max(0, c.unreadCount - 1) }
          }))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, loadConversations])

  /* ── per-conversation messages real-time ── */
  useEffect(() => {
    if (!activeConv?.listingId) return

    const listingId = activeConv.listingId
    const otherId   = activeConv.otherId
    const convKey   = activeConv.key
    const userId    = user.id

    const ch = supabase.channel(`thread-${listingId}-${otherId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, (payload) => {
        const msg = payload.new
        const belongs =
          (msg.listing_id === listingId) &&
          ((msg.sender_id === otherId && msg.receiver_id === userId) ||
           (msg.sender_id === userId  && msg.receiver_id === otherId))
        if (!belongs) return

        setMessages(prev =>
          prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
        )

        if (msg.receiver_id === userId) {
          supabase.from('messages').update({ is_read: true }).eq('id', msg.id)
          setConversations(prev => prev.map(c =>
            c.key === convKey ? { ...c, lastMsg: msg, unreadCount: 0 } : c
          ))
        } else {
          setConversations(prev => prev.map(c =>
            c.key === convKey ? { ...c, lastMsg: msg } : c
          ))
        }

        setTimeout(() => {
          if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
        }, 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [activeConv?.listingId, activeConv?.otherId, user?.id])    // eslint-disable-line

  /* ── presence: online status + typing indicator ── */
  useEffect(() => {
    if (!activeConv?.listingId || !user) return

    const listingId = activeConv.listingId
    const otherId   = activeConv.otherId
    const chanName  = `presence-${listingId}-${[user.id, otherId].sort().join('-')}`

    setOtherOnline(false)
    setOtherTyping(false)

    const ch = supabase.channel(chanName, { config: { presence: { key: user.id } } })
      .on('presence', { event: 'sync' }, () => {
        const state   = ch.presenceState()
        const others  = (state[otherId] || [])
        setOtherOnline(others.length > 0)
        setOtherTyping(others.some(p => p.typing === true))
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === otherId) setOtherOnline(true)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (key === otherId) {
          setOtherOnline(false)
          setOtherTyping(false)
        }
        void leftPresences
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ user_id: user.id, typing: false })
        }
      })

    presenceChanRef.current = ch

    return () => {
      clearTimeout(typingTimerRef.current)
      presenceChanRef.current = null
      supabase.removeChannel(ch)
    }
  }, [activeConv?.listingId, activeConv?.otherId, user?.id])    // eslint-disable-line

  /* ── helpers ── */

  function scrollToBottom() {
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
    }, 30)
  }

  function selectConversation(conv) {
    // Mark messages as read in local state immediately
    const readMsgs = conv.messages.map(m =>
      m.receiver_id === user.id ? { ...m, is_read: true } : m
    )
    setActiveConv(conv)
    setMessages(readMsgs)
    setMobileView('thread')
    scrollToBottom()

    // Update conversations list: unreadCount → 0, messages → read
    setConversations(prev =>
      prev.map(c => c.key === conv.key
        ? { ...c, unreadCount: 0, messages: readMsgs }
        : c
      )
    )

    // DB update
    if (conv.listingId) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('listing_id', conv.listingId)
        .eq('receiver_id', user.id)
        .eq('sender_id', conv.otherId)
        .eq('is_read', false)
        .then(() => {})
    } else {
      supabase
        .from('messages')
        .update({ is_read: true })
        .is('listing_id', null)
        .eq('receiver_id', user.id)
        .eq('sender_id', conv.otherId)
        .eq('is_read', false)
        .then(() => {})
    }
  }

  function handleTextareaChange(e) {
    setReplyText(e.target.value)
    const ch = presenceChanRef.current
    if (ch) {
      if (!typingActiveRef.current) {
        typingActiveRef.current = true
        ch.track({ user_id: user.id, typing: true })
      }
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        typingActiveRef.current = false
        presenceChanRef.current?.track({ user_id: user.id, typing: false })
      }, 2000)
    }
  }

  async function sendMessage() {
    const text = replyText.trim()
    if (!text || !activeConv || sending) return
    setSending(true)

    // stop typing immediately on send
    clearTimeout(typingTimerRef.current)
    typingActiveRef.current = false
    presenceChanRef.current?.track({ user_id: user.id, typing: false })

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
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
    }, 50)

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

  async function deleteMessage(msgId) {
    setDeletingMsgId(msgId)
    const { error } = await supabase.from('messages').delete().eq('id', msgId)
    if (!error) {
      const newMsgs = messages.filter(m => m.id !== msgId)
      setMessages(newMsgs)

      const convKey = activeConvRef.current?.key
      setConversations(prev =>
        prev
          .map(c => {
            if (c.key !== convKey) return c
            const remaining = c.messages.filter(m => m.id !== msgId)
            if (remaining.length === 0) return null
            return { ...c, messages: remaining, lastMsg: remaining[remaining.length - 1] }
          })
          .filter(Boolean)
      )

      if (newMsgs.length === 0) {
        setActiveConv(null)
        setMobileView('list')
      }
    }
    setDeletingMsgId(null)
  }

  async function deleteConversation(conv) {
    setDeletingConv(true)
    let q = supabase.from('messages').delete()
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    if (conv.listingId === null) {
      q = q.is('listing_id', null)
    } else {
      q = q.eq('listing_id', conv.listingId)
    }
    await q
    setConversations(prev => prev.filter(c => c.key !== conv.key))
    if (activeConv?.key === conv.key) {
      setActiveConv(null)
      setMessages([])
      setMobileView('list')
    }
    setDeletingConv(false)
    setConfirmDeleteConv(null)
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`
        w-full sm:min-w-[280px] sm:max-w-[320px] flex-shrink-0
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
            const other      = profiles[conv.otherId]
            const isSupport  = conv.listingId === null
            const name       = isSupport ? 'HorecaHub Dəstək' : sellerName(other)
            const isActive   = activeConv?.key === conv.key
            const last       = conv.lastMsg
            const isMine     = last.sender_id === user.id
            const hasUnread  = conv.unreadCount > 0

            return (
              <div key={conv.key} className={`relative group border-b border-gray-100
                ${isActive
                  ? isSupport ? 'bg-green-50 border-l-[3px] border-l-green-600'
                              : 'bg-blue-50 border-l-[3px] border-l-blue-600'
                  : 'hover:bg-gray-50'}
                transition-colors
              `}>
                <button
                  onClick={() => selectConversation(conv)}
                  className="w-full text-left px-4 py-4 pr-10"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      {isSupport ? (
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-base">
                          🛡
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {hasUnread && (
                        <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white px-0.5 ${isSupport ? 'bg-green-600' : 'bg-blue-600'}`}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate ${hasUnread ? 'font-bold' : 'font-semibold'} ${isSupport ? 'text-green-700' : 'text-navy'}`}>
                          {isSupport && <span className="mr-1">🛡</span>}{name}
                        </span>
                        <RelativeTime dateStr={last.created_at}
                          className="text-xs text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                      <p className={`text-xs font-medium truncate mb-0.5 ${isSupport ? 'text-green-600' : 'text-blue-600'}`}>
                        {isSupport ? 'Dəstək xidməti' : conv.listingTitle}
                      </p>
                      <p className={`text-xs truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                        {isMine && <span className="text-gray-400">{t('messages.you')} </span>}
                        {last.content}
                      </p>
                    </div>
                  </div>
                </button>

                {/* ··· menu */}
                <div className="absolute top-3 right-2">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setOpenMenuConvKey(k => k === conv.key ? null : conv.key)
                    }}
                    className="p-1 rounded text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={15} />
                  </button>
                  {openMenuConvKey === conv.key && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuConvKey(null)} />
                      <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setOpenMenuConvKey(null)
                            setConfirmDeleteConv(conv)
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Söhbəti sil
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
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
          <div className="flex-1 flex items-center justify-center text-center px-8">
            <div>
              <MessageSquare size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-sm font-medium">{t('messages.selectConversation')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            {(() => {
              const convIsSupport = activeConv.listingId === null
              return (
                <div className={`px-4 py-3 border-b flex items-center gap-3 flex-shrink-0 ${convIsSupport ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <button className="sm:hidden p-1 -ml-1 text-gray-500 hover:text-navy"
                    onClick={() => { setMobileView('list'); setActiveConv(null) }}>
                    <ChevronLeft size={20} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm truncate ${convIsSupport ? 'text-green-700' : 'text-navy'}`}>
                        {convIsSupport ? '🛡 HorecaHub Dəstək' : sellerName(profiles[activeConv.otherId])}
                      </p>
                      {!convIsSupport && otherOnline && (
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                    </div>
                    {convIsSupport ? (
                      <p className="text-xs text-green-600 font-medium">Dəstək xidməti</p>
                    ) : (
                      <Link to={`/listings/${activeConv.listingId}`}
                        className="text-xs text-blue-600 hover:underline truncate block">
                        {activeConv.listingTitle} →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Messages list */}
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-1">
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

                const mine        = item.sender_id === user.id
                const isAdminMsg  = !mine && item.is_support === true
                const isDeleting  = deletingMsgId === item.id
                return (
                  <div key={item.id}
                    className={`group flex items-end gap-1 ${mine ? 'justify-end' : 'justify-start'}`}>

                    {mine && !item._opt && (
                      <button
                        onClick={() => deleteMessage(item.id)}
                        disabled={isDeleting}
                        className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-red-400 order-first"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}

                    <div className={`
                      max-w-[75%] px-4 py-2.5 rounded-2xl text-sm
                      ${mine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : isAdminMsg
                          ? 'bg-green-50 border border-green-200 text-green-900 rounded-bl-sm'
                          : 'bg-gray-100 text-navy rounded-bl-sm'}
                      ${item._opt || isDeleting ? 'opacity-60' : ''}
                    `}>
                      {isAdminMsg && (
                        <p className="text-[10px] font-bold text-green-600 mb-1">🛡 HorecaHub Dəstək</p>
                      )}
                      <p className="leading-relaxed break-words whitespace-pre-wrap">
                        {item.content}
                      </p>
                      <p className={`text-[11px] mt-1 ${mine ? 'text-blue-200' : isAdminMsg ? 'text-green-500' : 'text-gray-400'}`}>
                        <RelativeTime dateStr={item.created_at} />
                      </p>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {otherTyping && (
                <div className="flex justify-start pt-1">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center h-3">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reply input */}
            <div className="flex-shrink-0 border-t border-gray-100 p-3">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={handleTextareaChange}
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

      {/* ── Delete conversation modal ── */}
      {confirmDeleteConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-navy mb-2">Söhbəti sil</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bu söhbəti silmək istəyirsiniz? Bütün mesajlar silinəcək və bu əməliyyat geri qaytarıla bilməz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteConv(null)}
                disabled={deletingConv}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Ləğv et
              </button>
              <button
                onClick={() => deleteConversation(confirmDeleteConv)}
                disabled={deletingConv}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deletingConv && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

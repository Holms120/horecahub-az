import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Send, ChevronLeft, MessageSquare, Inbox } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import RelativeTime from '../components/RelativeTime'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'

function sellerName(p) {
  if (!p) return i18n.t('messages.unknownUser')
  return p.full_name || p.company_name || (p.email ? p.email.split('@')[0] : i18n.t('messages.unknownUser'))
}

function dateLabel(iso) {
  const d    = new Date(iso)
  const now  = new Date()
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString())  return 'Bu gün'
  if (d.toDateString() === yest.toDateString()) return 'Dünən'
  return d.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' })
}

function groupByDate(msgs) {
  const out = []; let lastD = ''
  for (const m of msgs) {
    const d = new Date(m.created_at).toDateString()
    if (d !== lastD) { out.push({ _date: m.created_at }); lastD = d }
    out.push(m)
  }
  return out
}

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
  const [otherTyping, setOtherTyping]     = useState(false)

  const threadRef      = useRef(null)
  const chatChanRef    = useRef(null)
  const typingTimer    = useRef(null)
  const activeConvRef  = useRef(null)
  const profilesRef    = useRef({})

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { state: { from: '/messages' } })
  }, [user, authLoading, navigate])

  useEffect(() => { if (user) loadConversations() }, [user])

  // Keep refs in sync
  useEffect(() => { activeConvRef.current = activeConv },   [activeConv])
  useEffect(() => { profilesRef.current   = profiles },     [profiles])

  // Sidebar real-time: incoming messages from anyone
  useEffect(() => {
    if (!user) return
    const ch = supabase.channel('sidebar-rt')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new
        const key = `${msg.listing_id}::${msg.sender_id}`
        const isActive = activeConvRef.current?.key === key

        setConversations(prev => {
          const exists = prev.some(c => c.key === key)
          if (!exists) { loadConversations(); return prev }
          return [...prev.map(c => c.key !== key ? c : {
            ...c,
            lastMsg:    msg,
            unreadCount: isActive ? 0 : c.unreadCount + 1,
          })].sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at))
        })

        if (!profilesRef.current[msg.sender_id]) {
          supabase.from('profiles').select('id, full_name, company_name, email')
            .eq('id', msg.sender_id).single()
            .then(({ data }) => { if (data) setProfiles(p => ({ ...p, [data.id]: data })) })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user])

  // Cleanup chat channel on unmount
  useEffect(() => () => {
    if (chatChanRef.current) supabase.removeChannel(chatChanRef.current)
  }, [])

  /* ─── helpers ─────────────────────────────────────────── */

  function scrollToBottom(smooth = false) {
    setTimeout(() => {
      if (threadRef.current)
        threadRef.current.scrollTo({ top: threadRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
    }, 30)
  }

  async function loadConversations() {
    setLoadingConvs(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*, listings(id, title)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    if (error || !data) { setLoadingConvs(false); return }

    const convMap = new Map()
    for (const msg of data) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const key     = `${msg.listing_id}::${otherId}`
      if (!convMap.has(key)) {
        convMap.set(key, {
          key, listingId: msg.listing_id,
          listingTitle: msg.listings?.title || '',
          otherId, messages: [], lastMsg: msg, unreadCount: 0,
        })
      }
      const c = convMap.get(key)
      c.messages.push(msg)
      c.lastMsg = msg
      if (msg.receiver_id === user.id && !msg.is_read) c.unreadCount++
    }

    const convList = [...convMap.values()]
      .sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at))
    setConversations(convList)

    const otherIds = [...new Set(convList.map(c => c.otherId))]
    if (otherIds.length) {
      const { data: pData } = await supabase
        .from('profiles').select('id, full_name, company_name, email').in('id', otherIds)
      if (pData) {
        const map = {}; pData.forEach(p => { map[p.id] = p })
        setProfiles(map)
      }
    }
    setLoadingConvs(false)
  }

  function setupChatChannel(conv) {
    if (chatChanRef.current) {
      supabase.removeChannel(chatChanRef.current)
      chatChanRef.current = null
    }
    const [uid1, uid2] = [user.id, conv.otherId].sort()
    const ch = supabase.channel(`chat-${conv.listingId}-${uid1}-${uid2}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `listing_id=eq.${conv.listingId}`,
      }, (payload) => {
        const msg = payload.new
        if (msg.sender_id === user.id) return           // own message — optimistic handles it
        if (msg.sender_id !== conv.otherId) return       // different conversation on same listing
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
        if (msg.receiver_id === user.id) {
          supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {})
          setConversations(prev => prev.map(c =>
            c.key === conv.key ? { ...c, lastMsg: msg, unreadCount: 0 } : c
          ))
        }
        scrollToBottom(true)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState()
        setOtherTyping(
          Object.values(state).flat().some(p => p.user_id !== user.id && p.typing)
        )
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await ch.track({ user_id: user.id, typing: false })
      })
    chatChanRef.current = ch
  }

  function selectConversation(conv) {
    setActiveConv(conv)
    setMessages(conv.messages)
    setMobileView('thread')
    setOtherTyping(false)
    scrollToBottom()
    setupChatChannel(conv)
    if (conv.unreadCount > 0) {
      setConversations(prev => prev.map(c => c.key === conv.key ? { ...c, unreadCount: 0 } : c))
      supabase.from('messages').update({ is_read: true })
        .eq('listing_id', conv.listingId).eq('receiver_id', user.id)
        .eq('sender_id', conv.otherId).eq('is_read', false)
        .then(() => {})
    }
  }

  async function sendMessage() {
    const text = replyText.trim()
    if (!text || !activeConv || sending) return
    setSending(true)

    const optId  = `opt-${Date.now()}`
    const optMsg = {
      id: optId, _opt: true,
      listing_id: activeConv.listingId,
      sender_id: user.id, receiver_id: activeConv.otherId,
      content: text, created_at: new Date().toISOString(), is_read: false,
    }
    setMessages(prev => [...prev, optMsg])
    setReplyText('')
    scrollToBottom(true)

    const { data, error } = await supabase.from('messages').insert({
      listing_id:  activeConv.listingId,
      sender_id:   user.id,
      receiver_id: activeConv.otherId,
      content:     text,
    }).select().single()

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === optId ? data : m))
      setConversations(prev => prev.map(c =>
        c.key === activeConv.key ? { ...c, lastMsg: data } : c
      ))
    } else {
      setMessages(prev => prev.filter(m => m.id !== optId))
      setReplyText(text)
    }
    setSending(false)
  }

  function handleTyping() {
    if (!chatChanRef.current) return
    chatChanRef.current.track({ user_id: user.id, typing: true })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      chatChanRef.current?.track({ user_id: user.id, typing: false })
    }, 2000)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* ─── render ──────────────────────────────────────────── */

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

  const grouped = groupByDate(messages)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-navy mb-6">{t('messages.title')}</h1>

      <div className="flex border border-gray-200 rounded-2xl overflow-hidden"
        style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>

        {/* ── Sidebar ── */}
        <div className={`w-full lg:w-80 flex-shrink-0 border-r border-gray-200 flex flex-col ${
          mobileView === 'thread' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {conversations.length} {t('messages.conversations')}
            </p>
          </div>
          <div className="overflow-y-auto flex-1">
            {conversations.map(conv => {
              const other    = profiles[conv.otherId]
              const name     = sellerName(other)
              const isActive = activeConv?.key === conv.key
              const last     = conv.lastMsg
              const isMine   = last.sender_id === user.id
              const hasUnread = conv.unreadCount > 0

              return (
                <button key={conv.key}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
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
                        <span className={`text-sm truncate text-navy ${hasUnread ? 'font-bold' : 'font-semibold'}`}>{name}</span>
                        <RelativeTime dateStr={last.created_at} className="text-xs text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-xs text-blue-600 font-medium truncate mb-0.5">{conv.listingTitle}</p>
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
        </div>

        {/* ── Thread panel ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${
          mobileView === 'list' && !activeConv ? 'hidden lg:flex' : 'flex'
        }`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-center px-8">
              <div>
                <MessageSquare size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{t('messages.selectConversation')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                <button className="lg:hidden p-1 text-gray-500 hover:text-navy"
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

              {/* Messages */}
              <div ref={threadRef} className="flex-1 overflow-y-auto p-4">
                {grouped.map((item, i) => {
                  if (item._date) {
                    return (
                      <div key={`d-${i}`} className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{dateLabel(item._date)}</span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                    )
                  }
                  const mine = item.sender_id === user.id
                  return (
                    <div key={item.id} className={`flex mb-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        mine
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-navy rounded-bl-sm'
                      } ${item._opt ? 'opacity-60' : ''}`}>
                        <p className="leading-relaxed break-words whitespace-pre-wrap">{item.content}</p>
                        <p className={`text-[11px] mt-1 ${mine ? 'text-blue-200' : 'text-gray-400'}`}>
                          <RelativeTime dateStr={item.created_at} />
                        </p>
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicator */}
                {otherTyping && (
                  <div className="flex justify-start mb-2">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Reply box */}
              <div className="p-3 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyText}
                    onChange={e => { setReplyText(e.target.value); handleTyping() }}
                    onKeyDown={handleKeyDown}
                    placeholder={t('messages.replyPlaceholder')}
                    rows={2}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                  <button onClick={sendMessage}
                    disabled={!replyText.trim() || sending}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0 w-11 h-11 flex items-center justify-center"
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
        </div>

      </div>
    </div>
  )
}

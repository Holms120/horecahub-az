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

export default function Messages() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [profiles, setProfiles]           = useState({})
  const [activeKey, setActiveKey]         = useState(null)
  const [replyText, setReplyText]         = useState('')
  const [sending, setSending]             = useState(false)
  const [loading, setLoading]             = useState(true)
  const [mobileView, setMobileView]       = useState('list')
  const [unreadKeys, setUnreadKeys]       = useState(new Set())
  const threadRef          = useRef(null)
  const activeKeyRef       = useRef(null)
  const conversationsRef   = useRef([])
  const profilesRef        = useRef({})

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { state: { from: '/messages' } })
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) loadMessages()
  }, [user])

  // Mark all received messages as read when page opens
  useEffect(() => {
    if (!user) return
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .then(() => {})
  }, [user])

  // Keep refs in sync
  useEffect(() => { activeKeyRef.current     = activeKey },     [activeKey])
  useEffect(() => { conversationsRef.current = conversations }, [conversations])
  useEffect(() => { profilesRef.current      = profiles },      [profiles])

  // Scroll to bottom when active conversation changes or messages update
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [activeKey, conversations])

  // Real-time subscription for incoming messages
  useEffect(() => {
    if (!user) return
    const channel = supabase.channel('messages-rt')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new
        const key = `${msg.listing_id}::${msg.sender_id}`
        const exists = conversationsRef.current.some(c => c.key === key)

        if (!exists) {
          // New conversation — full reload to get listing title and profile
          loadMessages()
          return
        }

        setConversations(prev => {
          const updated = prev.map(c =>
            c.key !== key ? c : { ...c, messages: [...c.messages, msg], lastMsg: msg }
          )
          return [...updated].sort((a, b) =>
            new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at)
          )
        })

        // Fetch sender profile if not cached
        if (!profilesRef.current[msg.sender_id]) {
          supabase.from('profiles').select('id, full_name, company_name, email')
            .eq('id', msg.sender_id).single()
            .then(({ data }) => {
              if (data) setProfiles(p => ({ ...p, [data.id]: data }))
            })
        }

        // Badge for inactive conversations
        if (activeKeyRef.current !== key) {
          setUnreadKeys(prev => new Set([...prev, key]))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function loadMessages() {
    setLoading(true)
    // Mark all received messages as read
    await supabase.from('messages').update({ is_read: true })
      .eq('receiver_id', user.id).eq('is_read', false)
    const { data, error } = await supabase
      .from('messages')
      .select('*, listings(id, title)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    if (error || !data) { setLoading(false); return }

    // Group into conversations keyed by listing_id::other_user_id
    const convMap = new Map()
    for (const msg of data) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      const key = `${msg.listing_id}::${otherId}`
      if (!convMap.has(key)) {
        convMap.set(key, {
          key,
          listingId:    msg.listing_id,
          listingTitle: msg.listings?.title || '',
          otherId,
          messages:     [],
          lastMsg:      msg,
        })
      }
      convMap.get(key).messages.push(msg)
      convMap.get(key).lastMsg = msg
    }

    const convList = Array.from(convMap.values())
      .sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at))

    setConversations(convList)

    // Fetch profiles for other users
    const otherIds = [...new Set(convList.map(c => c.otherId))]
    if (otherIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .in('id', otherIds)
      if (pData) {
        const map = {}
        pData.forEach(p => { map[p.id] = p })
        setProfiles(map)
      }
    }
    setLoading(false)
  }

  async function sendReply() {
    if (!replyText.trim() || !activeConv) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      listing_id:  activeConv.listingId,
      sender_id:   user.id,
      receiver_id: activeConv.otherId,
      content:     replyText.trim(),
    })
    if (!error) {
      setReplyText('')
      await loadMessages()
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() }
  }

  const activeConv = activeKey ? conversations.find(c => c.key === activeKey) : null

  if (authLoading || loading) {
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-navy mb-6">{t('messages.title')}</h1>

      <div className="flex border border-gray-200 rounded-2xl overflow-hidden"
        style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>

        {/* ── Conversation list ── */}
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
              const isActive = activeKey === conv.key
              const last     = conv.lastMsg
              const isMine   = last.sender_id === user.id

              return (
                <button
                  key={conv.key}
                  onClick={() => {
                    setActiveKey(conv.key)
                    setMobileView('thread')
                    setUnreadKeys(prev => { const n = new Set(prev); n.delete(conv.key); return n })
                  }}
                  className={`w-full text-left px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      {unreadKeys.has(conv.key) && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate ${unreadKeys.has(conv.key) ? 'font-bold' : 'font-semibold'} text-navy`}>{name}</span>
                        <RelativeTime dateStr={last.created_at} className="text-xs text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                      <p className="text-xs text-blue-600 font-medium truncate mb-0.5">{conv.listingTitle}</p>
                      <p className={`text-xs truncate ${unreadKeys.has(conv.key) ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
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
              {/* Thread header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
                <button className="lg:hidden p-1 text-gray-500 hover:text-navy"
                  onClick={() => { setMobileView('list'); setActiveKey(null) }}>
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
              <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeConv.messages.map(msg => {
                  const mine = msg.sender_id === user.id
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        mine
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-navy rounded-bl-sm'
                      }`}>
                        <p className="leading-relaxed break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${mine ? 'text-blue-200' : 'text-gray-400'}`}>
                          <RelativeTime dateStr={msg.created_at} />
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Reply box */}
              <div className="p-3 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('messages.replyPlaceholder')}
                    rows={2}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim() || sending}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    <Send size={18} />
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

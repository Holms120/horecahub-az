import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MessageSquare, Send, ArrowRight } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

/*
 * Inline chat on the listing page: buyer ↔ seller thread scoped to one
 * listing. Shows full history, live updates and unread badge; the full
 * inbox lives on /messages.
 */
export default function ListingChat({ listingId, sellerId, openSignal = 0 }) {
  const { t }    = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState([])
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)

  const threadRef = useRef(null)
  const openRef   = useRef(false)
  useEffect(() => { openRef.current = open }, [open])

  const isOwner    = !!(user && user.id === sellerId)
  const hasHistory = msgs.length > 0
  const unread     = user ? msgs.filter(m => m.receiver_id === user.id && !m.is_read).length : 0

  /* ── load existing conversation ── */
  useEffect(() => {
    if (!user || !listingId || !sellerId || user.id === sellerId) return
    let cancelled = false
    supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listingId)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setMsgs(data)
      })
    return () => { cancelled = true }
  }, [user?.id, listingId, sellerId]) // eslint-disable-line

  /* ── realtime: new messages in this thread ── */
  useEffect(() => {
    if (!user || !listingId || !sellerId || user.id === sellerId) return
    const userId = user.id
    const ch = supabase.channel(`listing-chat-${listingId}-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, (payload) => {
        const m = payload.new
        const belongs = m.listing_id === listingId &&
          ((m.sender_id === sellerId && m.receiver_id === userId) ||
           (m.sender_id === userId   && m.receiver_id === sellerId))
        if (!belongs) return
        const incoming = m.receiver_id === userId
        const markRead = incoming && openRef.current
        setMsgs(prev => prev.some(x => x.id === m.id)
          ? prev
          : [...prev, markRead ? { ...m, is_read: true } : m])
        if (markRead) {
          supabase.from('messages').update({ is_read: true }).eq('id', m.id).then(() => {})
        }
        scrollDown()
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user?.id, listingId, sellerId]) // eslint-disable-line

  function scrollDown() {
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
    }, 50)
  }

  function markThreadRead() {
    setMsgs(prev => prev.map(m =>
      m.receiver_id === user.id ? { ...m, is_read: true } : m
    ))
    supabase.from('messages')
      .update({ is_read: true })
      .eq('listing_id', listingId)
      .eq('receiver_id', user.id)
      .eq('sender_id', sellerId)
      .eq('is_read', false)
      .then(() => {})
  }

  function toggleOpen() {
    if (!user) {
      navigate('/login', { state: { from: `/listings/${listingId}` } })
      return
    }
    const next = !open
    setOpen(next)
    if (next) {
      if (unread > 0) markThreadRead()
      scrollDown()
    }
  }

  /* ── open requested from outside (mobile sticky bar) ── */
  useEffect(() => {
    if (!openSignal) return
    if (!user) {
      navigate('/login', { state: { from: `/listings/${listingId}` } })
      return
    }
    setOpen(true)
    markThreadRead()
    scrollDown()
  }, [openSignal]) // eslint-disable-line

  async function send() {
    const body = text.trim()
    if (!body || sending || !user) return
    setSending(true)

    const optId = `opt-${Date.now()}`
    setMsgs(prev => [...prev, {
      id: optId, _opt: true,
      listing_id:  listingId,
      sender_id:   user.id,
      receiver_id: sellerId,
      content:     body,
      is_read:     false,
      created_at:  new Date().toISOString(),
    }])
    setText('')
    scrollDown()

    const { data, error } = await supabase
      .from('messages')
      .insert({
        listing_id:  listingId,
        sender_id:   user.id,
        receiver_id: sellerId,
        content:     body,
      })
      .select()
      .single()

    if (!error && data) {
      setMsgs(prev => prev.map(m => m.id === optId ? data : m))
      // fire-and-forget: email the seller if they have no unread yet
      supabase.functions
        .invoke('notify-message-email', { body: { message_id: data.id } })
        .catch(() => {})
    } else {
      setMsgs(prev => prev.filter(m => m.id !== optId))
      setText(body)
    }
    setSending(false)
  }

  if (isOwner || !sellerId) return null

  return (
    <div>
      <button
        onClick={toggleOpen}
        className="w-full py-3.5 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
      >
        <MessageSquare size={18} />
        {hasHistory ? t('listingChat.continueChat') : t('listingDetail.sendMessage')}
        {unread > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-sm font-semibold text-navy">{t('listingChat.title')}</span>
            <Link to="/messages" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              {t('listingChat.openInMessages')} <ArrowRight size={12} />
            </Link>
          </div>

          {/* thread */}
          <div ref={threadRef} className="max-h-72 overflow-y-auto px-4 py-3 space-y-2">
            {!hasHistory && (
              <p className="text-sm text-gray-400 text-center py-4">{t('listingChat.emptyHint')}</p>
            )}
            {msgs.map(m => {
              const own = m.sender_id === user?.id
              return (
                <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    own ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-navy rounded-bl-md'
                  } ${m._opt ? 'opacity-60' : ''}`}>
                    {m.content}
                    <div className={`text-[10px] mt-0.5 text-right ${own ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* composer */}
          <div className="flex items-end gap-2 px-3 py-3 border-t border-gray-100">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={t('listingDetail.messagePlaceholder')}
              rows={1}
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

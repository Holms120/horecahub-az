import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, X, Send, Trash2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

/*
 * Floating AI support widget (replaces the Crisp chat bubble).
 * Answers come from the `support-ai` edge function (Claude); history is
 * kept in localStorage so the thread survives reloads. Escalation goes to
 * the human channels: /messages support chat (logged in) or /contact.
 */
const STORAGE_KEY  = 'horecahub_ai_chat'
const MAX_STORED   = 30
const HISTORY_SENT = 12
const FAQ_IDS      = [1, 2, 3, 4]

function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter(m =>
      m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
  } catch {
    return []
  }
}

export default function SupportWidget() {
  const { t, i18n } = useTranslation()
  const { user }    = useAuth()

  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState(loadHistory)
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)

  const threadRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED)))
    } catch { /* quota — history just won't persist */ }
  }, [msgs])

  useEffect(() => {
    if (open || sending) {
      setTimeout(() => {
        if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
      }, 50)
    }
  }, [open, msgs, sending])

  async function send(question) {
    const content = (question ?? text).trim()
    if (!content || sending) return

    const history = [...msgs, { role: 'user', content }]
    setMsgs(history)
    setText('')
    setSending(true)

    const { data, error } = await supabase.functions.invoke('support-ai', {
      body: {
        messages: history.slice(-HISTORY_SENT),
        lang: ['az', 'ru', 'en'].includes(i18n.language) ? i18n.language : 'az',
      },
    })

    setMsgs(prev => [...prev, {
      role: 'assistant',
      content: (!error && data?.reply) ? data.reply : t('aiSupport.error'),
    }])
    setSending(false)
  }

  function clearChat() {
    setMsgs([])
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  const faqs = FAQ_IDS
    .map(id => t(`support.faq.${id}.question`))
    .filter(q => q && !q.startsWith('support.faq'))

  return (
    <>
      {/* bubble */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={t('aiSupport.open')}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-36 lg:inset-x-auto lg:right-6 lg:bottom-24 z-50 lg:w-[380px] h-[60vh] lg:h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 bg-navy text-white">
            <div>
              <p className="font-bold text-sm">{t('aiSupport.title')}</p>
              <p className="text-[11px] text-blue-200">{t('aiSupport.subtitle')}</p>
            </div>
            <div className="flex items-center gap-1">
              {msgs.length > 0 && (
                <button onClick={clearChat} title={t('aiSupport.clear')}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label={t('aiSupport.close')}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* thread */}
          <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
            {/* welcome */}
            <div className="flex justify-start">
              <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-md text-sm bg-white border border-gray-200 text-navy leading-relaxed">
                {t('aiSupport.welcome')}
              </div>
            </div>

            {/* FAQ quick questions */}
            {msgs.length === 0 && (
              <div className="flex flex-col items-start gap-2 pt-1">
                {faqs.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="px-3.5 py-2 text-sm text-left font-medium text-blue-700 bg-white border border-blue-200 rounded-full hover:bg-blue-50 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-navy rounded-tl-md'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-gray-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* composer */}
          <div className="border-t border-gray-100 bg-white px-3 pt-2.5 pb-2">
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={t('aiSupport.placeholder')}
                rows={1}
                className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={() => send()}
                disabled={!text.trim() || sending}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-[11px] text-gray-400">{t('aiSupport.disclaimer')}</span>
              <Link to={user ? '/messages' : '/contact'} onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-blue-600 hover:underline">
                {t('aiSupport.escalate')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

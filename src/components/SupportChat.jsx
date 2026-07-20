import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useTranslation } from 'react-i18next'
import RelativeTime from './RelativeTime'
import { storageGet, storageSet, storageRemove } from '../lib/safeStorage'

const FAQ_IDS = [1, 2, 3, 4, 5, 6]

export default function SupportChat({ conv, user, messages }) {
  const { t } = useTranslation()
  const [chatState, setChatState] = useState('menu') // 'menu' | 'answered' | 'open' | 'closed'
  const [selectedFaq, setSelectedFaq] = useState(null)
  const [inputText, setInputText]     = useState('')
  const [sending, setSending]         = useState(false)
  const bottomRef = useRef(null)

  const faqs = FAQ_IDS.map(id => {
    const raw = t(`support.faq.${id}.answer`)
    return {
      id,
      question: t(`support.faq.${id}.question`),
      answer: raw || null,
    }
  })

  // Clear closed flag on mount (next visit starts fresh)
  useEffect(() => {
    const key = `horecahub_support_closed_${user.id}`
    if (storageGet(key)) storageRemove(key)
  }, [user.id])

  // Auto-scroll when new messages arrive in 'open' state
  useEffect(() => {
    if (chatState === 'open') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatState])

  function handleFaqClick(faq) {
    setSelectedFaq(faq)
    setChatState(faq.answer ? 'answered' : 'open')
  }

  function handleEndChat() {
    storageSet(`horecahub_support_closed_${user.id}`, '1')
    setChatState('closed')
  }

  async function handleSend() {
    const text = inputText.trim()
    if (!text || sending) return
    setSending(true)
    setInputText('')
    await supabase.from('messages').insert({
      listing_id:  null,
      sender_id:   user.id,
      receiver_id: conv.otherId,
      content:     text,
    })
    setSending(false)
  }

  function BotBubble({ text }) {
    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
          🛡
        </div>
        <div className="max-w-[80%] bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
          <p className="text-[10px] font-bold text-green-600 mb-1">{t('messages.supportName')}</p>
          <p className="text-navy leading-relaxed">{text}</p>
        </div>
      </div>
    )
  }

  function UserBubble({ text }) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
          {text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── menu ── */}
        {chatState === 'menu' && (
          <>
            <BotBubble text={t('support.welcome')} />
            <p className="text-xs text-gray-400 mb-3 ml-9">{t('support.selectQuestion')}</p>
            <div className="ml-9 space-y-2">
              {faqs.map(faq => (
                <button
                  key={faq.id}
                  onClick={() => handleFaqClick(faq)}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-navy border border-gray-200 rounded-full hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  {faq.question}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── answered ── */}
        {chatState === 'answered' && selectedFaq && (
          <>
            <UserBubble text={selectedFaq.question} />
            <BotBubble text={selectedFaq.answer} />
            <div className="ml-9 flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => { setSelectedFaq(null); setChatState('menu') }}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50 transition-colors"
              >
                {t('support.askAnother')}
              </button>
              <button
                onClick={handleEndChat}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
              >
                {t('support.endChat')}
              </button>
            </div>
          </>
        )}

        {/* ── open ── */}
        {chatState === 'open' && (
          <>
            {selectedFaq && <UserBubble text={selectedFaq.question} />}
            <BotBubble text={t('support.openPrompt')} />

            {messages.map(msg => {
              const mine = msg.sender_id === user.id
              return (
                <div key={msg.id} className={`flex mb-3 ${mine ? 'justify-end' : 'items-start gap-2'}`}>
                  {!mine && (
                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
                      🛡
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    mine
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-green-50 border border-green-200 text-green-900 rounded-tl-sm'
                  }`}>
                    {!mine && (
                      <p className="text-[10px] font-bold text-green-600 mb-1">
                        🛡 {t('messages.supportName')}
                      </p>
                    )}
                    <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-[11px] mt-1 ${mine ? 'text-blue-200' : 'text-green-500'}`}>
                      <RelativeTime dateStr={msg.created_at} />
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}

        {/* ── closed ── */}
        {chatState === 'closed' && (
          <BotBubble text={t('support.closedMessage')} />
        )}
      </div>

      {/* Input — only in 'open' state */}
      {chatState === 'open' && (
        <div className="flex-shrink-0 border-t border-gray-100 p-3">
          <div className="flex gap-2 items-end">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              disabled={sending}
              placeholder={t('support.inputPlaceholder')}
              rows={2}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                resize-none disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="w-11 h-11 flex-shrink-0 bg-blue-600 text-white rounded-xl
                hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {sending
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={18} />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

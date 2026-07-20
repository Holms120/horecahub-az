import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Phone, Mail, Instagram, Facebook, MessageCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { notifyTelegram } from '../lib/notify'
import { useAuth } from '../context/AuthContext'

export default function Contact() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loadingSupport, setLoadingSupport] = useState(false)

  const items = [
    {
      Icon: Phone,
      label: t('contact.phone'),
      value: '+994 055 622 29 12',
      href: 'tel:+9940556222912',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      Icon: Mail,
      label: t('contact.email'),
      value: 'horecahub.az@gmail.com',
      href: 'mailto:horecahub.az@gmail.com',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      Icon: Instagram,
      label: t('contact.instagram'),
      value: '@horecahub.az',
      href: 'https://www.instagram.com/horecahub.az',
      color: 'bg-pink-50 text-pink-600',
    },
    {
      Icon: Facebook,
      label: t('contact.facebook'),
      value: 'Horeca Hub',
      href: 'https://www.facebook.com/profile.php?id=61589830914631',
      color: 'bg-indigo-50 text-indigo-600',
    },
  ]

  async function handleSupportMessage() {
    if (!user) { navigate('/login', { state: { from: '/contact' } }); return }
    setLoadingSupport(true)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)
    const adminId = admins?.[0]?.id
    if (!adminId) { setLoadingSupport(false); return }
    // Check if support conversation already exists
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
      .is('listing_id', null)
      .limit(1)
    if (!existing?.length) {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: adminId,
        listing_id: null,
        content: 'Salam! Sizinlə əlaqə saxlamaq istəyirəm.',
        is_support: true,
      })
    }

    await notifyTelegram({
      title: '💬 Support mesajı',
      category: 'Support',
      city: '',
      user_name: user?.user_metadata?.full_name || user?.email || 'Anonim',
    })
    setLoadingSupport(false)
    navigate('/messages')
  }

  return (
    <div>
      <Helmet><title>{`${t('contact.title')} — HorecaHub`}</title></Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-blue-700 text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-blue-200 text-xs font-semibold tracking-widest uppercase mb-3">HorecaHub.az</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('contact.title')}</h1>
        </div>
      </section>

      {/* Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="space-y-4">
            {items.map(({ Icon, label, value, href, color }) => {
              const inner = (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-base font-semibold text-navy">{value}</p>
                  </div>
                </div>
              )

              return href ? (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}>
                  {inner}
                </a>
              ) : (
                <div key={label}>{inner}</div>
              )
            })}

            {/* Support message button */}
            <button
              onClick={handleSupportMessage}
              disabled={loadingSupport}
              className="w-full bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-5 hover:shadow-md transition-shadow text-left disabled:opacity-60"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-green-50 text-green-600">
                {loadingSupport
                  ? <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  : <MessageCircle size={22} />}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('contact.liveSupport')}</p>
                <p className="text-base font-semibold text-navy">{t('contact.writeSupport')}</p>
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

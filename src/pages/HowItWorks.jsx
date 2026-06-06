import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { UserPlus, ClipboardList, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full py-4 text-left gap-4"
      >
        <span className="font-medium text-navy text-sm sm:text-base">{q}</span>
        {open
          ? <ChevronUp size={18} className="text-blue-600 flex-shrink-0" />
          : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function HowItWorks() {
  const { t } = useTranslation()

  const STEPS = [
    {
      number: 1, Icon: UserPlus, color: 'bg-blue-50 text-blue-600',
      title: t('howItWorks.step1Title'), desc: t('howItWorks.step1Desc'),
    },
    {
      number: 2, Icon: ClipboardList, color: 'bg-emerald-50 text-emerald-600',
      title: t('howItWorks.step2Title'), desc: t('howItWorks.step2Desc'),
    },
    {
      number: 3, Icon: MessageCircle, color: 'bg-purple-50 text-purple-600',
      title: t('howItWorks.step3Title'), desc: t('howItWorks.step3Desc'),
    },
  ]

  const FAQS = [
    { q: t('howItWorks.q1'), a: t('howItWorks.a1') },
    { q: t('howItWorks.q2'), a: t('howItWorks.a2') },
    { q: t('howItWorks.q3'), a: t('howItWorks.a3') },
    { q: t('howItWorks.q4'), a: t('howItWorks.a4') },
    { q: t('howItWorks.q5'), a: t('howItWorks.a5') },
  ]

  return (
    <div>
      <Helmet><title>{t('howItWorks.title')} — HorecaHub</title></Helmet>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-blue-700 text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-blue-200 text-xs font-semibold tracking-widest uppercase mb-3">{t('howItWorks.badge')}</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('howItWorks.title')}</h1>
          <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.number} className="relative">
                {/* Connector line (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-8 h-px bg-gray-200 -translate-x-4 z-0" />
                )}
                <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:shadow-md transition-shadow relative z-10 h-full">
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                      <s.Icon size={24} />
                    </div>
                    <span className="text-3xl font-bold text-gray-100 select-none">{String(s.number).padStart(2, '0')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-3">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-blue-600 mb-2">{t('howItWorks.faqTitle')}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-navy">{t('howItWorks.faqSubtitle')}</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl px-6">
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {t('howItWorks.ctaTitle')}
          </h2>
          <p className="text-blue-100 mb-8">
            {t('howItWorks.ctaDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/sell"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
              {t('howItWorks.ctaPost')}
            </Link>
            <Link to="/listings"
              className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
              {t('howItWorks.ctaBrowse')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

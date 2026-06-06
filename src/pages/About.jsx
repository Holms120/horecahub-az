import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  const values = [
    { emoji: '🔍', title: t('about.value1Title'), desc: t('about.value1Desc') },
    { emoji: '🛡️', title: t('about.value2Title'), desc: t('about.value2Desc') },
    { emoji: '🎯', title: t('about.value3Title'), desc: t('about.value3Desc') },
  ]

  return (
    <div>
      <Helmet><title>{`${t('about.title')} — HorecaHub`}</title></Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-blue-700 text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-blue-200 text-xs font-semibold tracking-widest uppercase mb-3">HorecaHub.az</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('about.title')}</h1>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-navy mb-5">{t('about.missionTitle')}</h2>
          <p className="text-gray-600 text-lg leading-relaxed">{t('about.mission')}</p>
        </div>
      </section>

      {/* Who we are */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-navy mb-5">{t('about.whoTitle')}</h2>
          <p className="text-gray-600 leading-relaxed text-base">{t('about.who')}</p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-navy text-center mb-10">{t('about.valuesTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map(v => (
              <div key={v.title} className="bg-white border border-gray-200 rounded-2xl p-8 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{v.emoji}</div>
                <h3 className="text-lg font-bold text-navy mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-xl mx-auto px-4 text-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t('about.cta')}
          </Link>
        </div>
      </section>
    </div>
  )
}

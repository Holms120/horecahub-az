import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'

export default function ComingSoon() {
  const { t } = useTranslation()

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <Helmet><title>{`${t('comingSoon.title')} — HorecaHub`}</title></Helmet>
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock size={36} className="text-blue-600" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-navy mb-3">{t('comingSoon.title')}</h1>
      <p className="text-gray-500 text-base mb-10 max-w-sm">{t('comingSoon.desc')}</p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
      >
        {t('comingSoon.backHome')}
      </Link>
    </div>
  )
}

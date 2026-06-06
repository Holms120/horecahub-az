import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <Helmet><title>{t('notFound.title')} — HorecaHub</title></Helmet>
      <p className="text-8xl md:text-9xl font-bold text-blue-600 leading-none mb-4 select-none">
        {t('notFound.code')}
      </p>
      <h1 className="text-2xl md:text-3xl font-bold text-navy mb-3">
        {t('notFound.title')}
      </h1>
      <p className="text-gray-500 text-base mb-10 max-w-sm">
        {t('notFound.desc')}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          {t('notFound.backHome')}
        </Link>
        <Link to="/listings"
          className="px-6 py-3 border border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50 transition-colors">
          {t('notFound.browseListings')}
        </Link>
      </div>
    </div>
  )
}

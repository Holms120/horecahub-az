import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'

const POSTS = [
  {
    id: 'azerbaycan-horeca-bazari-2025',
    title: {
      az: 'Azərbaycanda HoReCa Bazarı: 2025-ci il rəqəmləri',
      ru: 'Рынок HoReCa в Азербайджане: цифры 2025 года',
      en: 'Azerbaijan HoReCa Market: 2025 Figures',
    },
    excerpt: {
      az: 'İctimai iaşə dövriyyəsi 2 milyard manata yaxınlaşır, sektor ildə 13% böyüyür. Bazarın tam mənzərəsi — rəqəmlər, tendensiyalar, imkanlar.',
      ru: 'Оборот общественного питания приближается к 2 млрд манат, сектор растёт на 13% в год. Полная картина рынка — цифры, тенденции, возможности.',
      en: 'Food service turnover approaches 2 billion manats, the sector grows 13% per year. The full market picture — figures, trends, opportunities.',
    },
    date: {
      az: '25 İyun 2026',
      ru: '25 июня 2026',
      en: 'June 25, 2026',
    },
    readTime: {
      az: '5 dəqiqə',
      ru: '5 минут',
      en: '5 min read',
    },
    category: {
      az: 'Bazar analizi',
      ru: 'Анализ рынка',
      en: 'Market Analysis',
    },
  },
  {
    id: 'bakida-kafe-acmaq-real-xercler-2025',
    title: {
      az: 'Bakıda kafe açmaq — real xərclər 2025',
      ru: 'Открыть кафе в Баку — реальные расходы 2025',
      en: 'Opening a Café in Baku — Real Costs 2025',
    },
    excerpt: {
      az: 'Coffee shop üçün 30,000–60,000 AZN, orta kafe üçün 80,000–150,000 AZN. Xərclərin tam bölgüsü, hüquqi addımlar, ən çox edilən səhvlər.',
      ru: 'Coffee shop: 30 000–60 000 AZN, среднее кафе: 80 000–150 000 AZN. Полная структура расходов, юридические шаги, самые частые ошибки.',
      en: 'Coffee shop: 30,000–60,000 AZN, medium café: 80,000–150,000 AZN. Full cost breakdown, legal steps, and the most common mistakes.',
    },
    date: {
      az: '25 İyun 2026',
      ru: '25 июня 2026',
      en: 'June 25, 2026',
    },
    readTime: {
      az: '6 dəqiqə',
      ru: '6 минут',
      en: '6 min read',
    },
    category: {
      az: 'Praktiki bələdçi',
      ru: 'Практическое руководство',
      en: 'Practical Guide',
    },
  },
  {
    id: 'restoran-meneceri-niye-tapilmir',
    title: {
      az: 'Restoran meneceri niyə tapılmır?',
      ru: 'Почему не найти менеджера ресторана?',
      en: 'Why Is It So Hard to Find a Restaurant Manager?',
    },
    excerpt: {
      az: 'Azərbaycanda hər restoran sahibinin ən böyük problemi. Kadr böhranının struktural səbəbləri və praktiki həll yolları.',
      ru: 'Главная проблема каждого владельца ресторана в Азербайджане. Структурные причины кадрового кризиса и практические решения.',
      en: "Every restaurant owner's biggest problem in Azerbaijan. The structural causes of the staffing crisis and practical solutions.",
    },
    date: {
      az: '25 İyun 2026',
      ru: '25 июня 2026',
      en: 'June 25, 2026',
    },
    readTime: {
      az: '4 dəqiqə',
      ru: '4 минуты',
      en: '4 min read',
    },
    category: {
      az: 'Kadr məsələləri',
      ru: 'Кадровые вопросы',
      en: 'HR & Staffing',
    },
  },
]

const readLabel = { az: 'Oxu →', ru: 'Читать →', en: 'Read →' }
const subtitleLabel = {
  az: 'HoReCa sektoru haqqında analitik məqalələr və praktiki məsləhətlər',
  ru: 'Аналитические статьи и практические советы о секторе HoReCa',
  en: 'Analytical articles and practical advice about the HoReCa sector',
}

export default function Blog() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ru') ? 'ru' : i18n.language?.startsWith('en') ? 'en' : 'az'

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog — HorecaHub.az</title>
        <meta name="description" content="Azərbaycan HoReCa sektoru haqqında analitik məqalələr, bazar rəqəmləri və praktiki məsləhətlər." />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-2">Blog</h1>
        <p className="text-gray-500 mb-10">{subtitleLabel[lang]}</p>
        <div className="space-y-6">
          {POSTS.map(post => {
            const title    = typeof post.title    === 'object' ? post.title[lang]    || post.title.az    : post.title
            const excerpt  = typeof post.excerpt  === 'object' ? post.excerpt[lang]  || post.excerpt.az  : post.excerpt
            const date     = typeof post.date     === 'object' ? post.date[lang]     || post.date.az     : post.date
            const readTime = typeof post.readTime === 'object' ? post.readTime[lang] || post.readTime.az : post.readTime
            const category = typeof post.category === 'object' ? post.category[lang] || post.category.az : post.category

            return (
              <Link key={post.id} to={`/blog/${post.id}`}
                className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">{category}</span>
                  <span className="text-xs text-gray-400">{date}</span>
                  <span className="text-xs text-gray-400">· {readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-[#0A2342] mb-2 hover:text-blue-600 transition-colors">{title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{excerpt}</p>
                <span className="inline-block mt-4 text-sm text-blue-600 font-semibold">{readLabel[lang]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

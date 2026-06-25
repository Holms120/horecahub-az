import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'

const POSTS = [
  {
    id: 'azerbaycan-horeca-bazari-2025',
    title: 'Azərbaycanda HoReCa Bazarı: 2025-ci il rəqəmləri',
    excerpt: 'İctimai iaşə dövriyyəsi 2 milyard manata yaxınlaşır, sektor ildə 13% böyüyür. Bazarın tam mənzərəsi — rəqəmlər, tendensiyalar, imkanlar.',
    date: '2025-06-25',
    readTime: '5 dəqiqə',
    category: 'Bazar analizi',
    image: null,
  },
  {
    id: 'bakida-kafe-acmaq-real-xercler-2025',
    title: 'Bakıda kafe açmaq — real xərclər 2025',
    excerpt: 'Coffee shop üçün 30,000–60,000 AZN, orta kafe üçün 80,000–150,000 AZN. Xərclərin tam bölgüsü, hüquqi addımlar, ən çox edilən səhvlər.',
    date: '2025-06-25',
    readTime: '6 dəqiqə',
    category: 'Praktiki bələdçi',
  },
  {
    id: 'restoran-meneceri-niye-tapilmir',
    title: 'Restoran meneceri niyə tapılmır?',
    excerpt: 'Azərbaycanda hər restoran sahibinin ən böyük problemi. Kadr böhranının struktural səbəbləri və praktiki həll yolları.',
    date: '2025-06-25',
    readTime: '4 dəqiqə',
    category: 'Kadr məsələləri',
  }
]

export default function Blog() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog — HorecaHub.az</title>
        <meta name="description" content="Azərbaycan HoReCa sektoru haqqında analitik məqalələr, bazar rəqəmləri və praktiki məsləhətlər." />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-[#0A2342] mb-2">Blog</h1>
        <p className="text-gray-500 mb-10">HoReCa sektoru haqqında analitik məqalələr və praktiki məsləhətlər</p>
        <div className="space-y-6">
          {POSTS.map(post => (
            <Link key={post.id} to={`/blog/${post.id}`}
              className="block bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">{post.category}</span>
                <span className="text-xs text-gray-400">{post.date}</span>
                <span className="text-xs text-gray-400">· {post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-[#0A2342] mb-2 hover:text-blue-600 transition-colors">{post.title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
              <span className="inline-block mt-4 text-sm text-blue-600 font-semibold">Oxu →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

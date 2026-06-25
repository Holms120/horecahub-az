import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const POST_CONTENT = {
  'azerbaycan-horeca-bazari-2025': {
    title: 'Azərbaycanda HoReCa Bazarı: 2025-ci il rəqəmləri və tendensiyalar',
    date: '25 İyun 2025',
    readTime: '5 dəqiqə',
    category: 'Bazar analizi',
    content: `
      <h2>Bazarın həcmi — rəqəmlər danışır</h2>
      <div class="stats-grid">
        <div class="stat"><span class="label">2025-ci il dövriyyəsi (9 ay)</span><span class="value">~2 milyard AZN</span></div>
        <div class="stat"><span class="label">İllik artım</span><span class="value">13–14%</span></div>
        <div class="stat"><span class="label">Bakıda obyekt sayı</span><span class="value">12,000+</span></div>
        <div class="stat"><span class="label">Ölkə üzrə ümumi</span><span class="value">25,000+</span></div>
        <div class="stat"><span class="label">2023-cü il turist sayı</span><span class="value">4 milyon+</span></div>
      </div>
      <p>2022-ci ildə sektor dövriyyəsi 37% artmışdı — pandemiyadan bərpa effekti. 2025-ci ildə bu artım daha davamlı, lakin hələ də güclüdür: yanvar-avqust 14%, yanvar-sentyabr 13.2%. Sektor mövsümi dalgalanmalardan asılı olmayaraq stabil böyüyür.</p>

      <h2>Coğrafi bölgü — Bakı hər şeyin mərkəzidir</h2>
      <p>Yalnız Bakının Səbail və Nəsimi rayonlarında 1,500-dən çox ictimai iaşə müəssisəsi var. Bakı üzrə ümumi rəqəm 12,000-i keçib — bu, Sumqayıtdan 7 dəfə, Qəbələdən isə 27 dəfə çoxdur.</p>
      <p>Sumqayıt isə sürətlə inkişaf edən ikinci bazardır: əhali artımı, yeni yaşayış kompleksləri, artan orta sinif.</p>

      <h2>Turizm faktoru — böyük katalizator</h2>
      <p>2023-cü ildə Azərbaycana 4 milyondan çox turist gəldi. Bu rəqəm 2025–2026-cı illərdə daha da artmağa davam edir.</p>
      <ul>
        <li>Formula 1 Azərbaycan Qran Prisi — hər il Bakıda keçirilir</li>
        <li>UEFA Avropa Liqası finalı — 2019-cu ildə Chelsea–Arsenal (Bakı Olimpiya Stadionu)</li>
        <li>UEFA Euro 2020 — Bakı qrup mərhələsi oyunlarına ev sahibliyi etdi</li>
        <li>2027 UEFA Çempionlar Liqası finalı — Azərbaycan namizəd olaraq müraciət edib</li>
      </ul>

      <h2>Kadr bazarı — ən böyük problem</h2>
      <p>HoReCa sektorunda ən ciddi çətinlik peşəkar kadr saxlamaqdadır. Sektor Azərbaycanda ən aşağı əmək haqqı verən sahələr sırasındadır:</p>
      <div class="stats-grid">
        <div class="stat"><span class="label">Aşpaz</span><span class="value">800–1,500 AZN</span></div>
        <div class="stat"><span class="label">Baş aşpaz</span><span class="value">2,000–4,000 AZN</span></div>
        <div class="stat"><span class="label">Ofisiant</span><span class="value">500–800 AZN</span></div>
        <div class="stat"><span class="label">Bartender</span><span class="value">600–1,200 AZN</span></div>
        <div class="stat"><span class="label">Restoran meneceri</span><span class="value">1,500–3,000 AZN</span></div>
      </div>

      <h2>Specialty coffee inqilabı</h2>
      <p>Son 5 ildə Bakıda specialty coffee mədəniyyəti sürətlə inkişaf etdi. Yerli roastery-lər, third-wave coffee şoplar, filter qəhvə dəbi — bunlar artıq trend deyil, sabit bir hərəkat halını aldı. Bu inkişaf HorecaHub-da aşağıdakı kateqoriyaların tələbini artırır:</p>
      <ul>
        <li>Matcha tozu, salep, chai tea, alternativ süd</li>
        <li>Professional espresso maşınları</li>
        <li>Qəhvə üyüdənlər, barista alətləri</li>
        <li>Siroplar, toppinglər, qablaşdırma materialları</li>
      </ul>

      <h2>2025–2026 tendensiyaları</h2>
      <ul>
        <li>Delivery və dark kitchen — çatdırılma infrastrukturu güclənir</li>
        <li>Franchise modeli — beynəlxalq şəbəkələrin Azərbaycana girişi sürətlənir</li>
        <li>Sağlamlıqlı yeməklər — diet, gluten-free, vegan seçimlər</li>
        <li>Rəqəmsal idarəetmə — POS sistemləri, onlayn rezervasiya</li>
        <li>Specialty & artisan — fərdiləşdirilmiş məhsul və unikal təcrübə</li>
      </ul>

      <h2>HorecaHub.az niyə indi?</h2>
      <p>Azərbaycanın HoReCa sektoru ildə 13-14% böyüyür. 25,000+ müəssisə avadanlıq alır, kadr axtarır, xammal sifariş edir. Lakin bu alış-verişin böyük hissəsi hələ də şəxsi əlaqələr və WhatsApp vasitəsilə həyata keçirilir.</p>
      <p>HorecaHub.az bu boşluğu doldurmaq üçün yaradılıb — Azərbaycanda HoReCa sektoruna xüsusi ilk rəqəmsal marketplace.</p>
    `
  }
}

export default function BlogPost() {
  const { id } = useParams()
  const post = POST_CONTENT[id]

  if (!post) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Məqalə tapılmadı</p>
        <Link to="/blog" className="text-blue-600 hover:underline">Bloga qayıt</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{post.title} — HorecaHub.az</title>
        <meta name="description" content={POST_CONTENT[id]?.content?.replace(/<[^>]*>/g, '').slice(0, 155)} />
        <meta property="og:title" content={`${post.title} — HorecaHub.az`} />
        <meta property="og:type" content="article" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/blog" className="text-sm text-blue-600 hover:underline mb-6 inline-block">← Bloga qayıt</Link>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">{post.category}</span>
          <span className="text-xs text-gray-400">{post.date}</span>
          <span className="text-xs text-gray-400">· {post.readTime}</span>
        </div>
        <h1 className="text-3xl font-bold text-[#0A2342] mb-8 leading-snug">{post.title}</h1>
        <article
          className="prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <style>{`
          article h2 { font-size: 1.4rem; font-weight: 700; color: #0A2342; margin: 2rem 0 1rem; }
          article p { color: #374151; line-height: 1.8; margin-bottom: 1rem; }
          article ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
          article ul li { color: #374151; margin-bottom: 0.4rem; line-height: 1.7; }
          article .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 1.5rem 0; }
          article .stat { background: #F0F7FF; border-radius: 12px; padding: 14px 16px; }
          article .stat .label { display: block; font-size: 12px; color: #6B7280; margin-bottom: 4px; }
          article .stat .value { display: block; font-size: 18px; font-weight: 700; color: #0A2342; }
        `}</style>
      </div>
    </div>
  )
}

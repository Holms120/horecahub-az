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
  },
  'bakida-kafe-acmaq-real-xercler-2025': {
    title: 'Bakıda kafe açmaq — real xərclər 2025',
    date: '25 İyun 2025',
    readTime: '6 dəqiqə',
    category: 'Praktiki bələdçi',
    content: `
    <p>Bakıda hər gün yeni kafe açılır. Amma hər gün kafe bağlanır da. Fərq nədədir? Çox vaxt cavab sadədir: büdcə planlaması yanlış olub. Bu məqalədə biz real rəqəmləri paylaşırıq — nə qədər pul lazımdır, hara xərclənir, nə zaman geri qayıdır.</p>

    <h2>Format üzrə ilkin investisiya</h2>
    <div class="stats-grid">
      <div class="stat"><span class="label">Kiçik coffee shop (30-50 m²)</span><span class="value">30,000–60,000 AZN</span></div>
      <div class="stat"><span class="label">Orta kafe (80-120 m²)</span><span class="value">80,000–150,000 AZN</span></div>
      <div class="stat"><span class="label">Premium restoran</span><span class="value">200,000+ AZN</span></div>
    </div>
    <p>Bu rəqəmlərə icarə depoziti, təmir, avadanlıq, mebel, brendinq, ilkin stok və ilk 2-3 ayın əməliyyat xərcləri daxildir.</p>

    <h2>Xərclərin bölgüsü</h2>
    <div class="stats-grid">
      <div class="stat"><span class="label">İcarə depoziti + ilk ay</span><span class="value">15–20%</span></div>
      <div class="stat"><span class="label">Təmir və dizayn</span><span class="value">20–30%</span></div>
      <div class="stat"><span class="label">Mətbəx avadanlığı</span><span class="value">15–25%</span></div>
      <div class="stat"><span class="label">Zal mebeli</span><span class="value">10–15%</span></div>
      <div class="stat"><span class="label">İlk 2-3 ay əmək haqqı</span><span class="value">10–15%</span></div>
      <div class="stat"><span class="label">Gözlənilməz xərclər</span><span class="value">10–15%</span></div>
    </div>

    <h2>İcarə qiymətləri — ən böyük dəyişən</h2>
    <p>Bakıda icarə qiyməti lokasiyadan asılı olaraq dramatik şəkildə dəyişir. Nəsimi və Səbail — ən bahalı rayonlardır, Xətai və Nərimanov isə daha əlçatanlı alternativlər təqdim edir.</p>
    <p>Diqqət: Azərbaycanda icarə müqavilələri adətən sabit məbləğlə bağlanır — dövriyyəyə əsaslanan model yoxdur. Bu o deməkdir ki, satışınız az olsa belə, tam icarəni ödəməlisiz.</p>

    <h2>Hüquqi addımlar</h2>
    <ul>
      <li>Fərdi sahibkar və ya MMC kimi dövlət qeydiyyatı (ASAN Xidmət)</li>
      <li>VÖEN alınması və vergi rejimi seçimi — illik dövriyyəsi 200,000 AZN-ə qədər olanlar üçün sadələşdirilmiş vergi (2%) optimal</li>
      <li>Online kassa aparatı və POS terminal qeydiyyatı</li>
      <li>AQTA (Qida Təhlükəsizliyi Agentliyi) sanitariya tələbləri</li>
      <li>Yanğın təhlükəsizliyi icazəsi</li>
    </ul>
    <p>Alkoqol satmaq üçün ayrıca lisenziya tələb olunmur — amma reklamına ciddi məhdudiyyətlər var, 18 yaş tələbinə riayət məcburidir.</p>

    <h2>Gəlirlilik — real gözlənti</h2>
    <div class="stats-grid">
      <div class="stat"><span class="label">Sağlam net margin</span><span class="value">15%+</span></div>
      <div class="stat"><span class="label">Azərbaycanda ortalama</span><span class="value">5–12%</span></div>
      <div class="stat"><span class="label">ROI müddəti</span><span class="value">12–24 ay</span></div>
    </div>
    <p>Qida maya dəyəri: ət yeməklərində ~40%, qəlyənaltı və içkilərdə ~20%. Qəlyənaltı hər restoran üçün ən gəlirli kateqoriyadır.</p>

    <h2>Ən çox edilən səhvlər</h2>
    <ul>
      <li>Ehtiyat kapitalı saxlamamaq — ilk 6 ay "öyrənmə dövrü"dür</li>
      <li>Yanlış lokasiya seçimi — trafik olmayan yerdə açılmaq</li>
      <li>Marketinq planı olmadan başlamaq</li>
      <li>Açılışdan sonra keyfiyyəti düşürmək — yeni müştəri qazanmaqdan köhnəni saxlamaq daha çətindir</li>
      <li>Heyəti lazımi şəkildə təlimləndirməmək</li>
    </ul>

    <h2>HorecaHub-dan necə istifadə edə bilərsiniz?</h2>
    <p>Kafe açarkən avadanlıq, mebel, xidmət, kadr — hamısı lazımdır. HorecaHub.az-da Azərbaycanın HoReCa təchizatçıları bir yerdədir. Vasitəçisiz, birbaşa əlaqə.</p>
  `
  },
  'restoran-meneceri-niye-tapilmir': {
    title: 'Restoran meneceri niyə tapılmır?',
    date: '25 İyun 2025',
    readTime: '4 dəqiqə',
    category: 'Kadr məsələləri',
    content: `
    <p>Azərbaycanda hər restoran sahibinin ağzından eyni şikayəti eşitmək mümkündür: "Yaxşı menecer tapа bilmirəm." Bu təsadüf deyil. Kadr böhranının struktural səbəbləri var.</p>

    <h2>Rəqəmlər nə deyir?</h2>
    <div class="stats-grid">
      <div class="stat"><span class="label">Restoran meneceri orta maaşı</span><span class="value">1,650 AZN</span></div>
      <div class="stat"><span class="label">Bazar aralığı</span><span class="value">1,100–2,200 AZN</span></div>
      <div class="stat"><span class="label">Tələb olunan təcrübə</span><span class="value">3+ il</span></div>
      <div class="stat"><span class="label">Sektorda orta maaş</span><span class="value">745–783 AZN</span></div>
    </div>
    <p>İctimai iaşə sektoru Azərbaycanda ən aşağı əmək haqqı verən sahələr sırasındadır. Bu, istedadlı insanları digər sahələrə itəliyir.</p>

    <h2>Problemin kökü</h2>
    <p><strong>1. Peşəkar təhsil sistemi yoxdur.</strong> Azərbaycanda hospitality management üzrə güclü ali təhsil proqramı yoxdur. Menecerlər ya özü-özünü yetişdirir, ya xaricdə oxuyur, ya da digər sahələrdən gəlir.</p>
    <p><strong>2. Sektorda prestij aşağıdır.</strong> Restoran işi "müvəqqəti iş" kimi görülür, karyera perspektivi az bilinir. İstedadlı gənclər bank, IT, neft sektoru seçir.</p>
    <p><strong>3. İş şəraiti çətindir.</strong> Həftəsonu, bayram, gecə növbəsi — ailə həyatı ilə uzlaşdırmaq çətin olur. Eyni maaşla ofis işi daha cəlbedici görünür.</p>
    <p><strong>4. Tələb sürətlə artır.</strong> Bakıda son 5 ildə restoran sayı 2 dəfə artdı. Amma keyfiyyətli menecer bazarı eyni sürətlə böyümədi.</p>

    <h2>Sahibkarlar nə edir?</h2>
    <ul>
      <li>Ofisiantı menecer qaldırır — sürətli, amma riskli</li>
      <li>Xarici mütəxəssis gətirir — xərci yüksəkdir, iş icazəsi lazımdır</li>
      <li>Özü hər şeyi idarə edir — tükənmə riski yüksəkdir</li>
      <li>Tanışlıq yolu ilə tapır — çox vaxt peşəkar meyarlara görə deyil</li>
    </ul>

    <h2>Həll yolları</h2>
    <p><strong>Daxili yetişdirmə:</strong> Potensialı olan işçiləri erkən müəyyən edin, strukturlu inkişaf yolu hazırlayın. Bu ən davamlı həlldir.</p>
    <p><strong>Rəqabətqabiliyyətli maaş:</strong> 1,500–2,000 AZN aralığı istedadları saxlayır. Yaxşı meneceri itirmək daha bahalıya başa gəlir.</p>
    <p><strong>Şəffaf karyera yolu:</strong> Ofisiantdan menecerə, menecerdən direktora — bu yolun mövcudluğunu işçilərinizə göstərin.</p>
    <p><strong>Şərait və mədəniyyət:</strong> Pul hər şey deyil. İş mühiti, hörmət, münasibət — bunlar da saxlayır.</p>

    <h2>HorecaHub-da kadr bölməsi</h2>
    <p>HorecaHub.az-da "Kadrlar" kateqoriyası tam bu məsələ üçündür — istər iş axtaran peşəkarlar, istər işçi axtaran işəgötürənlər üçün Azərbaycanın ilk ixtisaslaşmış HoReCa kadr platforması.</p>
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

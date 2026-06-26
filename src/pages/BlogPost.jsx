import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'

const POST_CONTENT = {
  'azerbaycan-horeca-bazari-2025': {
    title: {
      az: 'Azərbaycanda HoReCa Bazarı: 2025-ci il rəqəmləri və tendensiyalar',
      ru: 'Рынок HoReCa в Азербайджане: цифры и тенденции 2025 года',
      en: 'Azerbaijan HoReCa Market: 2025 Figures and Trends',
    },
    date: { az: '25 İyun 2025', ru: '25 июня 2025', en: 'June 25, 2025' },
    readTime: { az: '5 dəqiqə', ru: '5 минут', en: '5 min read' },
    category: { az: 'Bazar analizi', ru: 'Анализ рынка', en: 'Market Analysis' },
    content: {
      az: `
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
    `,
      ru: `
        <h2>Объём рынка — цифры говорят сами за себя</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Оборот общепита (9 мес. 2025)</span><span class="value">~2 млрд AZN</span></div>
          <div class="stat"><span class="label">Годовой рост</span><span class="value">13–14%</span></div>
          <div class="stat"><span class="label">Заведений в Баку</span><span class="value">12 000+</span></div>
          <div class="stat"><span class="label">По всей стране</span><span class="value">25 000+</span></div>
          <div class="stat"><span class="label">Туристов в 2023 году</span><span class="value">4 млн+</span></div>
        </div>
        <p>В 2022 году оборот сектора вырос на 37% — эффект восстановления после пандемии. В 2025 году рост более устойчивый, но по-прежнему сильный: январь–август +14%, январь–сентябрь +13,2%. Сектор растёт стабильно, независимо от сезонных колебаний.</p>

        <h2>География — Баку остаётся центром</h2>
        <p>Только в районах Сабаил и Насими более 1 500 заведений общественного питания. По всему Баку их свыше 12 000 — это в 7 раз больше, чем в Сумгайыте.</p>
        <p>Сумгайыт — быстро развивающийся второй рынок: рост населения, новые жилые комплексы, растущий средний класс.</p>

        <h2>Туризм — мощный катализатор</h2>
        <p>В 2023 году Азербайджан посетили более 4 миллионов туристов. Этот показатель продолжает расти в 2025–2026 годах.</p>
        <ul>
          <li>Гран-при Формулы 1 Азербайджан — ежегодно проводится в Баку</li>
          <li>Финал Лиги Европы УЕФА 2019 — Chelsea против Arsenal на Олимпийском стадионе</li>
          <li>UEFA Euro 2020 — Баку принял матчи группового этапа</li>
          <li>Финал Лиги чемпионов УЕФА 2027 — Азербайджан подал заявку</li>
        </ul>

        <h2>Рынок труда — главная проблема</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Повар</span><span class="value">800–1 500 AZN</span></div>
          <div class="stat"><span class="label">Шеф-повар</span><span class="value">2 000–4 000 AZN</span></div>
          <div class="stat"><span class="label">Официант</span><span class="value">500–800 AZN</span></div>
          <div class="stat"><span class="label">Бармен</span><span class="value">600–1 200 AZN</span></div>
          <div class="stat"><span class="label">Менеджер ресторана</span><span class="value">1 500–3 000 AZN</span></div>
        </div>
        <p>Сфера общественного питания входит в число отраслей с наиболее низкими зарплатами в Азербайджане. Это отталкивает талантливых людей в другие сферы.</p>

        <h2>Революция specialty coffee</h2>
        <p>За последние 5 лет в Баку стремительно развилась культура specialty coffee. Местные обжарщики, кофейни третьей волны, фильтр-кофе — это уже не тренд, а устойчивое движение.</p>
        <ul>
          <li>Матча, салеп, чай, альтернативное молоко — основное сырьё specialty-кафе</li>
          <li>Профессиональные эспрессо-машины и кофемолки</li>
          <li>Сиропы, топпинги, упаковочные материалы</li>
        </ul>

        <h2>Тенденции 2025–2026</h2>
        <ul>
          <li>Доставка и dark kitchen — инфраструктура доставки активно развивается</li>
          <li>Франчайзинг — международные сети ускоряют выход на рынок Азербайджана</li>
          <li>Здоровое питание — растёт спрос на диетические, без глютена и веганские варианты</li>
          <li>Цифровое управление — POS-системы, онлайн-бронирование</li>
          <li>Specialty & artisan — спрос на персонализированные продукты и уникальный опыт</li>
        </ul>

        <h2>Почему HorecaHub.az — именно сейчас?</h2>
        <p>Рынок HoReCa Азербайджана растёт на 13–14% в год. Более 25 000 заведений закупают оборудование, ищут персонал, заказывают сырьё. Однако большая часть этих закупок по-прежнему осуществляется через личные связи и WhatsApp.</p>
        <p>HorecaHub.az создан для того, чтобы заполнить этот пробел — первый в Азербайджане цифровой маркетплейс, специализирующийся исключительно на секторе HoReCa.</p>
      `,
      en: `
        <h2>Market Size — The Numbers Speak</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">2025 catering turnover (9 months)</span><span class="value">~2 billion AZN</span></div>
          <div class="stat"><span class="label">Annual growth</span><span class="value">13–14%</span></div>
          <div class="stat"><span class="label">Venues in Baku</span><span class="value">12,000+</span></div>
          <div class="stat"><span class="label">Nationwide total</span><span class="value">25,000+</span></div>
          <div class="stat"><span class="label">Tourists in 2023</span><span class="value">4 million+</span></div>
        </div>
        <p>In 2022, the sector's turnover grew by 37% — a pandemic recovery effect. In 2025, growth is more stable but still strong: January–August +14%, January–September +13.2%. The sector grows steadily regardless of seasonal fluctuations.</p>

        <h2>Geography — Baku Is the Center of Everything</h2>
        <p>The Sabail and Nasimi districts of Baku alone have over 1,500 food service establishments. Across the whole of Baku, this number exceeds 12,000 — seven times more than Sumgayit.</p>
        <p>Sumgayit is the rapidly developing second market: population growth, new residential complexes, a rising middle class.</p>

        <h2>Tourism — A Powerful Catalyst</h2>
        <p>In 2023, Azerbaijan welcomed over 4 million tourists. This figure continues to rise through 2025–2026.</p>
        <ul>
          <li>Azerbaijan Formula 1 Grand Prix — held annually in Baku</li>
          <li>UEFA Europa League Final 2019 — Chelsea vs Arsenal at the Olympic Stadium</li>
          <li>UEFA Euro 2020 — Baku hosted group stage matches</li>
          <li>UEFA Champions League Final 2027 — Azerbaijan has submitted its candidacy</li>
        </ul>

        <h2>Labor Market — The Biggest Challenge</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Chef</span><span class="value">800–1,500 AZN</span></div>
          <div class="stat"><span class="label">Head Chef</span><span class="value">2,000–4,000 AZN</span></div>
          <div class="stat"><span class="label">Waiter</span><span class="value">500–800 AZN</span></div>
          <div class="stat"><span class="label">Bartender</span><span class="value">600–1,200 AZN</span></div>
          <div class="stat"><span class="label">Restaurant Manager</span><span class="value">1,500–3,000 AZN</span></div>
        </div>
        <p>The food service sector is among the lowest-paying industries in Azerbaijan. This pushes talented people toward other fields.</p>

        <h2>The Specialty Coffee Revolution</h2>
        <p>Over the past 5 years, specialty coffee culture has rapidly developed in Baku. Local roasters, third-wave coffee shops, filter coffee trends — these are no longer just a trend but a sustainable movement.</p>
        <ul>
          <li>Matcha, salep, chai, alternative milk — the core ingredients of specialty cafés</li>
          <li>Professional espresso machines and grinders</li>
          <li>Syrups, toppings, packaging materials</li>
        </ul>

        <h2>2025–2026 Trends</h2>
        <ul>
          <li>Delivery and dark kitchens — delivery infrastructure is rapidly expanding</li>
          <li>Franchise model — international chains are accelerating their entry into Azerbaijan</li>
          <li>Health-conscious food — growing demand for diet, gluten-free, and vegan options</li>
          <li>Digital management — POS systems, online reservations</li>
          <li>Specialty & artisan — demand for personalized products and unique experiences</li>
        </ul>

        <h2>Why HorecaHub.az — Why Now?</h2>
        <p>Azerbaijan's HoReCa market grows 13–14% annually. Over 25,000 establishments buy equipment, seek staff, and order supplies. Yet most of these transactions still happen through personal connections and WhatsApp.</p>
        <p>HorecaHub.az was created to fill this gap — Azerbaijan's first digital marketplace dedicated exclusively to the HoReCa sector.</p>
      `,
    },
  },
  'bakida-kafe-acmaq-real-xercler-2025': {
    title: {
      az: 'Bakıda kafe açmaq — real xərclər 2025',
      ru: 'Открыть кафе в Баку — реальные расходы 2025',
      en: 'Opening a Café in Baku — Real Costs 2025',
    },
    date: { az: '25 İyun 2025', ru: '25 июня 2025', en: 'June 25, 2025' },
    readTime: { az: '6 dəqiqə', ru: '6 минут', en: '6 min read' },
    category: { az: 'Praktiki bələdçi', ru: 'Практическое руководство', en: 'Practical Guide' },
    content: {
      az: `
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
  `,
      ru: `
        <p>В Баку каждый день открывается новое кафе. Но каждый день кафе и закрывается. В чём разница? Чаще всего ответ прост: неправильное планирование бюджета. В этой статье мы делимся реальными цифрами — сколько нужно денег, куда они уходят и когда окупаются.</p>

        <h2>Стартовые инвестиции по форматам</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Небольшой coffee shop (30–50 м²)</span><span class="value">30 000–60 000 AZN</span></div>
          <div class="stat"><span class="label">Среднее кафе (80–120 м²)</span><span class="value">80 000–150 000 AZN</span></div>
          <div class="stat"><span class="label">Премиум-ресторан</span><span class="value">от 200 000 AZN</span></div>
        </div>
        <p>В эти цифры входят: депозит за аренду, ремонт, оборудование, мебель, брендинг, начальный запас товаров и операционные расходы на первые 2–3 месяца.</p>

        <h2>Структура расходов</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Депозит + первый месяц аренды</span><span class="value">15–20%</span></div>
          <div class="stat"><span class="label">Ремонт и дизайн</span><span class="value">20–30%</span></div>
          <div class="stat"><span class="label">Кухонное оборудование</span><span class="value">15–25%</span></div>
          <div class="stat"><span class="label">Мебель для зала</span><span class="value">10–15%</span></div>
          <div class="stat"><span class="label">Зарплата первые 2–3 месяца</span><span class="value">10–15%</span></div>
          <div class="stat"><span class="label">Непредвиденные расходы</span><span class="value">10–15%</span></div>
        </div>

        <h2>Аренда — главная переменная</h2>
        <p>Стоимость аренды в Баку кардинально меняется в зависимости от района. Насими и Сабаил — самые дорогие, Хатаи и Нариманов — более доступные альтернативы.</p>
        <p>Важно: в Азербайджане договоры аренды заключаются по фиксированной ставке — модели привязки к обороту нет. Это значит, что даже при низких продажах полная арендная плата обязательна.</p>

        <h2>Юридические шаги</h2>
        <ul>
          <li>Регистрация как ИП или ООО (через ASAN Xidmət)</li>
          <li>Получение ИНН (VÖEN) и выбор налогового режима — упрощённый налог (2%) оптимален для большинства заведений с оборотом до 200 000 AZN в год</li>
          <li>Регистрация онлайн-кассы и POS-терминала</li>
          <li>Требования AQTA (Агентства по безопасности продуктов питания) по санитарии</li>
          <li>Разрешение пожарной безопасности</li>
        </ul>
        <p>Лицензия на продажу алкоголя отдельно не требуется — однако реклама строго ограничена, соблюдение возрастного ценза (18 лет) обязательно.</p>

        <h2>Прибыльность — реалистичные ожидания</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Здоровая чистая маржа</span><span class="value">15%+</span></div>
          <div class="stat"><span class="label">Средний показатель в Азербайджане</span><span class="value">5–12%</span></div>
          <div class="stat"><span class="label">Срок окупаемости (ROI)</span><span class="value">12–24 месяца</span></div>
        </div>
        <p>Себестоимость продуктов: мясные блюда ~40%, закуски и напитки ~20%. Закуски — самая прибыльная категория для любого ресторана.</p>

        <h2>Самые распространённые ошибки</h2>
        <ul>
          <li>Отсутствие резервного капитала — первые 6 месяцев это «период обучения»</li>
          <li>Неправильный выбор локации — открытие в месте без трафика</li>
          <li>Старт без маркетингового плана</li>
          <li>Снижение качества после открытия — удержать постоянного клиента сложнее, чем привлечь нового</li>
          <li>Недостаточное обучение персонала</li>
        </ul>

        <h2>Как помогает HorecaHub.az</h2>
        <p>При открытии кафе нужны оборудование, мебель, сервис, персонал — всё сразу. На HorecaHub.az поставщики HoReCa Азербайджана собраны в одном месте. Без посредников, напрямую.</p>
      `,
      en: `
        <p>Every day a new café opens in Baku. But every day a café closes too. What makes the difference? Most often the answer is simple: poor budget planning. In this article, we share real figures — how much money is needed, where it goes, and when it pays back.</p>

        <h2>Initial Investment by Format</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Small coffee shop (30–50 m²)</span><span class="value">30,000–60,000 AZN</span></div>
          <div class="stat"><span class="label">Medium café (80–120 m²)</span><span class="value">80,000–150,000 AZN</span></div>
          <div class="stat"><span class="label">Premium restaurant</span><span class="value">200,000+ AZN</span></div>
        </div>
        <p>These figures include: rental deposit, renovation, equipment, furniture, branding, initial stock, and operating costs for the first 2–3 months.</p>

        <h2>Cost Breakdown</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Deposit + first month rent</span><span class="value">15–20%</span></div>
          <div class="stat"><span class="label">Renovation and design</span><span class="value">20–30%</span></div>
          <div class="stat"><span class="label">Kitchen equipment</span><span class="value">15–25%</span></div>
          <div class="stat"><span class="label">Hall furniture</span><span class="value">10–15%</span></div>
          <div class="stat"><span class="label">Salaries for first 2–3 months</span><span class="value">10–15%</span></div>
          <div class="stat"><span class="label">Contingency fund</span><span class="value">10–15%</span></div>
        </div>

        <h2>Rent — The Biggest Variable</h2>
        <p>Rental prices in Baku vary dramatically by district. Nasimi and Sabail are the most expensive, while Khatai and Narimanov offer more accessible alternatives.</p>
        <p>Important: In Azerbaijan, lease agreements are signed at fixed rates — there's no turnover-based model. This means full rent is due even when sales are low.</p>

        <h2>Legal Steps</h2>
        <ul>
          <li>Register as a sole trader or LLC (via ASAN Xidmət)</li>
          <li>Obtain TIN (VÖEN) and choose tax regime — simplified tax (2%) is optimal for most venues with annual turnover under 200,000 AZN</li>
          <li>Register online cash register and POS terminal</li>
          <li>AQTA (Food Safety Agency) sanitary requirements</li>
          <li>Fire safety permit</li>
        </ul>
        <p>No separate alcohol licence is required — however, advertising is strictly restricted and age compliance (18+) is mandatory.</p>

        <h2>Profitability — Realistic Expectations</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Healthy net margin</span><span class="value">15%+</span></div>
          <div class="stat"><span class="label">Azerbaijan average</span><span class="value">5–12%</span></div>
          <div class="stat"><span class="label">ROI period</span><span class="value">12–24 months</span></div>
        </div>
        <p>Food cost: meat dishes ~40%, snacks and drinks ~20%. Snacks are the most profitable category for any restaurant.</p>

        <h2>Most Common Mistakes</h2>
        <ul>
          <li>No reserve capital — the first 6 months are a "learning period"</li>
          <li>Wrong location choice — opening in a low-traffic area</li>
          <li>Starting without a marketing plan</li>
          <li>Lowering quality after opening — retaining existing customers is harder than attracting new ones</li>
          <li>Insufficient staff training</li>
        </ul>

        <h2>How HorecaHub.az Can Help</h2>
        <p>When opening a café you need equipment, furniture, services, staff — all at once. On HorecaHub.az, Azerbaijan's HoReCa suppliers are in one place. No middlemen, direct contact.</p>
      `,
    },
  },
  'restoran-meneceri-niye-tapilmir': {
    title: {
      az: 'Restoran meneceri niyə tapılmır?',
      ru: 'Почему не найти менеджера ресторана?',
      en: 'Why Is It So Hard to Find a Restaurant Manager?',
    },
    date: { az: '25 İyun 2025', ru: '25 июня 2025', en: 'June 25, 2025' },
    readTime: { az: '4 dəqiqə', ru: '4 минуты', en: '4 min read' },
    category: { az: 'Kadr məsələləri', ru: 'Кадровые вопросы', en: 'HR & Staffing' },
    content: {
      az: `
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
  `,
      ru: `
        <p>В Азербайджане практически каждый владелец ресторана жалуется на одно и то же: «Не могу найти хорошего менеджера». Это не совпадение. У кадрового кризиса есть структурные причины.</p>

        <h2>Что говорят цифры?</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Средняя зарплата менеджера</span><span class="value">1 650 AZN</span></div>
          <div class="stat"><span class="label">Диапазон рынка</span><span class="value">1 100–2 200 AZN</span></div>
          <div class="stat"><span class="label">Требуемый опыт</span><span class="value">3+ лет</span></div>
          <div class="stat"><span class="label">Средняя зарплата в секторе</span><span class="value">745–783 AZN</span></div>
        </div>
        <p>Сфера общественного питания — одна из самых низкооплачиваемых в Азербайджане. Это вытесняет талантливых людей в другие отрасли.</p>

        <h2>Корень проблемы</h2>
        <p><strong>1. Нет системы профессионального образования.</strong> В Азербайджане нет сильной программы по hospitality management. Менеджеры либо самоучки, либо приехали из-за рубежа, либо пришли из других сфер.</p>
        <p><strong>2. Низкий престиж сектора.</strong> Работа в ресторане воспринимается как «временная занятость», карьерные перспективы мало известны. Талантливая молодёжь выбирает банки, IT, нефтяной сектор.</p>
        <p><strong>3. Тяжёлые условия труда.</strong> Выходные, праздники, ночные смены — сложно совмещать с семейной жизнью. При той же зарплате офисная работа выглядит привлекательнее.</p>
        <p><strong>4. Спрос растёт быстрее предложения.</strong> За последние 5 лет число ресторанов в Баку удвоилось. Но рынок квалифицированных менеджеров не растёт с той же скоростью.</p>

        <h2>Что делают владельцы?</h2>
        <ul>
          <li>Повышают официанта до менеджера — быстро, но рискованно</li>
          <li>Привозят иностранного специалиста — дорого, нужно разрешение на работу</li>
          <li>Управляют всем сами — высокий риск выгорания</li>
          <li>Находят через знакомых — часто не по профессиональным критериям</li>
        </ul>

        <h2>Решения</h2>
        <p><strong>Внутреннее воспитание кадров:</strong> выявляйте перспективных сотрудников заранее, стройте структурированный карьерный путь. Это самое устойчивое решение.</p>
        <p><strong>Конкурентная зарплата:</strong> диапазон 1 500–2 000 AZN удерживает таланты. Потерять хорошего менеджера обходится дороже.</p>
        <p><strong>Прозрачный карьерный путь:</strong> от официанта до менеджера, от менеджера до директора — покажите сотрудникам, что этот путь реален.</p>
        <p><strong>Условия труда и корпоративная культура:</strong> деньги — не всё. Рабочая атмосфера, уважение, отношения — они тоже удерживают.</p>

        <h2>Раздел «Кадры» на HorecaHub.az</h2>
        <p>Раздел «Кадры» на HorecaHub.az создан именно для этого — как для специалистов, ищущих работу, так и для работодателей, ищущих сотрудников. Первая специализированная HoReCa-кадровая платформа в Азербайджане.</p>
      `,
      en: `
        <p>In Azerbaijan, you can hear the same complaint from almost every restaurant owner: "I can't find a good manager." This is no coincidence. The staffing crisis has structural causes.</p>

        <h2>What Do the Numbers Say?</h2>
        <div class="stats-grid">
          <div class="stat"><span class="label">Average manager salary</span><span class="value">1,650 AZN</span></div>
          <div class="stat"><span class="label">Market range</span><span class="value">1,100–2,200 AZN</span></div>
          <div class="stat"><span class="label">Required experience</span><span class="value">3+ years</span></div>
          <div class="stat"><span class="label">Average sector salary</span><span class="value">745–783 AZN</span></div>
        </div>
        <p>The food service sector is among the lowest-paying industries in Azerbaijan. This pushes talented people toward other fields.</p>

        <h2>The Root of the Problem</h2>
        <p><strong>1. No professional education system.</strong> Azerbaijan lacks a strong hospitality management programme. Managers are either self-taught, educated abroad, or come from other industries.</p>
        <p><strong>2. Low sector prestige.</strong> Restaurant work is seen as "temporary employment", career prospects are little known. Talented young people choose banking, IT, or the oil sector.</p>
        <p><strong>3. Difficult working conditions.</strong> Weekends, holidays, night shifts — hard to balance with family life. At the same salary, office work looks more attractive.</p>
        <p><strong>4. Demand outpaces supply.</strong> Over the past 5 years, the number of restaurants in Baku has doubled. But the market for qualified managers hasn't grown at the same pace.</p>

        <h2>What Do Owners Do?</h2>
        <ul>
          <li>Promote a waiter to manager — fast but risky</li>
          <li>Bring in a foreign specialist — expensive, requires a work permit</li>
          <li>Manage everything themselves — high risk of burnout</li>
          <li>Find someone through connections — often not based on professional criteria</li>
        </ul>

        <h2>Solutions</h2>
        <p><strong>Internal talent development:</strong> identify promising staff early, build a structured development path. This is the most sustainable solution.</p>
        <p><strong>Competitive salary:</strong> the 1,500–2,000 AZN range retains talent. Losing a good manager costs more in the long run.</p>
        <p><strong>Transparent career path:</strong> from waiter to manager, from manager to director — show your staff that this path is real.</p>
        <p><strong>Working conditions and culture:</strong> money isn't everything. Work environment, respect, relationships — these retain people too.</p>

        <h2>The "Staff" Section on HorecaHub.az</h2>
        <p>The "Staff" section on HorecaHub.az was built for exactly this purpose — for both professionals seeking work and employers seeking staff. Azerbaijan's first specialised HoReCa staffing platform.</p>
      `,
    },
  },
}

export default function BlogPost() {
  const { id } = useParams()
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ru') ? 'ru' : i18n.language?.startsWith('en') ? 'en' : 'az'

  const post = POST_CONTENT[id]

  if (!post) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Məqalə tapılmadı</p>
        <Link to="/blog" className="text-blue-600 hover:underline">Bloga qayıt</Link>
      </div>
    </div>
  )

  const title    = typeof post.title    === 'object' ? post.title[lang]    || post.title.az    : post.title
  const date     = typeof post.date     === 'object' ? post.date[lang]     || post.date.az     : post.date
  const readTime = typeof post.readTime === 'object' ? post.readTime[lang] || post.readTime.az : post.readTime
  const category = typeof post.category === 'object' ? post.category[lang] || post.category.az : post.category
  const content  = typeof post.content  === 'object' ? post.content[lang]  || post.content.az  : post.content

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{title} — HorecaHub.az</title>
        <meta name="description" content={content?.replace(/<[^>]*>/g, '').slice(0, 155)} />
        <meta property="og:title" content={`${title} — HorecaHub.az`} />
        <meta property="og:type" content="article" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/blog" className="text-sm text-blue-600 hover:underline mb-6 inline-block">← Bloga qayıt</Link>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">{category}</span>
          <span className="text-xs text-gray-400">{date}</span>
          <span className="text-xs text-gray-400">· {readTime}</span>
        </div>
        <h1 className="text-3xl font-bold text-[#0A2342] mb-8 leading-snug">{title}</h1>
        <article
          className="prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
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

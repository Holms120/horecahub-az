import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

function Section({ title, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-navy mb-4">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

function Li({ children }) {
  return (
    <li className="flex gap-2">
      <span className="text-blue-600 font-bold flex-shrink-0">•</span>
      <span>{children}</span>
    </li>
  )
}

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Helmet><title>İstifadə şərtləri — HorecaHub</title></Helmet>
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-blue-600 tracking-widest uppercase mb-2">Hüquqi sənəd</p>
        <h1 className="text-3xl font-bold text-navy mb-3">İstifadə Şərtləri</h1>
        <p className="text-sm text-gray-500">Son yenilənmə: 2026</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 mb-10 text-sm text-blue-800">
        HorecaHub.az platformundan istifadə etməklə siz aşağıda göstərilən istifadə şərtlərini qəbul etmiş sayılırsınız.
        Şərtlərlə razı deyilsinizsə, platformadan istifadəni dayandırın.
      </div>

      <Section title="1. Ümumi müddəalar">
        <p>
          HorecaHub.az ("Platforma") Azərbaycan Respublikasında qeydiyyatdan keçmiş şirkət tərəfindən idarə edilən
          HoReCa (Hotel, Restoran, Kafe) sektoru üçün ixtisaslaşmış elektron ticarət platformasıdır.
        </p>
        <p>
          Platforma istifadəçilərə avadanlıq, işçi heyəti və təchizat sahəsində elan yerləşdirmək,
          axtarmaq və satıcılarla birbaşa əlaqə saxlamaq imkanı verir.
        </p>
        <p>
          Bu Şərtlər Azərbaycan Respublikasının qanunvericiliyi əsasında tənzimlənir.
        </p>
      </Section>

      <Section title="2. İstifadəçinin öhdəlikləri">
        <p>Platformaya qeydiyyatdan keçərək siz aşağıdakıları öhdəyə alırsınız:</p>
        <ul className="space-y-2 mt-2">
          <Li>Qeydiyyat zamanı dürüst və tam məlumat vermək;</Li>
          <Li>Hesab məlumatlarınızın (e-poçt, şifrə) məxfiliyini qorumaq;</Li>
          <Li>Platformadan yalnız qanuni məqsədlər üçün istifadə etmək;</Li>
          <Li>Digər istifadəçilərə hörmətlə yanaşmaq, hər hansı taciz, təhqir və ya zərər verici davranışdan çəkinmək;</Li>
          <Li>Yerləşdirdiyiniz elanların həqiqi, dəqiq və aktual olmasını təmin etmək;</Li>
          <Li>Platformanın texniki infrastrukturuna zərər verə biləcək hər hansı hərəkətdən (virus, DoS hücumu, vəhşi yükləmə) çəkinmək.</Li>
        </ul>
      </Section>

      <Section title="3. Qadağan edilmiş məzmun">
        <p>Aşağıdakı məzmunu yerləşdirmək qəti qadağandır:</p>
        <ul className="space-y-2 mt-2">
          <Li>Saxta, yanıltıcı və ya aldadıcı elanlar;</Li>
          <Li>Qeyri-qanuni mallar, kontrafakt məhsullar və ya qanunvericiliyə zidd xidmətlər;</Li>
          <Li>Canlı heyvan, silah, narkotik maddə və ya qadağan edilmiş hər hansı əşya;</Li>
          <Li>Digər şəxslərin şəxsi məlumatları, fotoşəkilləri və ya əqli mülkiyyəti icazəsiz şəkildə;</Li>
          <Li>Cinsi, irqi, dini və ya etnik ayrı-seçkiliyə çağıran məzmun;</Li>
          <Li>Spam, zəncirvari mesajlar və ya kütləvi reklam məzmunu.</Li>
        </ul>
        <p className="mt-3">
          Bu qaydalara zidd elanlar öncədən xəbərdarlıq edilmədən silinə bilər.
          Ciddi pozuntular hesabın bağlanmasına səbəb ola bilər.
        </p>
      </Section>

      <Section title="4. Elan yerləşdirmə qaydaları">
        <ul className="space-y-2">
          <Li>Hər elan yalnız bir kateqoriyaya aid olmalıdır;</Li>
          <Li>Başlıq və təsvir Azərbaycan dilində, aydın və anlaşıqlı şəkildə yazılmalıdır;</Li>
          <Li>Qiymət real bazar qiymətinə uyğun olmalıdır; qəsdən yanıltıcı qiymətlər qoyulmamalıdır;</Li>
          <Li>Şəkillər yüksək keyfiyyətli, elanın obyektini açıq şəkildə əks etdirməli, su nişanı olmadan olmalıdır;</Li>
          <Li>Satıldıqdan sonra elan dərhal silinməli və ya "Deaktiv" edilməlidir;</Li>
          <Li>Eyni məhsul üçün eyni anda birdən çox elan yerləşdirmək qadağandır.</Li>
        </ul>
      </Section>

      <Section title="5. Platforma öhdəlikləri">
        <p>HorecaHub.az aşağıdakıları öhdəsinə alır:</p>
        <ul className="space-y-2 mt-2">
          <Li>Platformanın fasiləsiz əlçatanlığını təmin etməyə çalışmaq;</Li>
          <Li>İstifadəçi məlumatlarının müasir şifrələmə standartları ilə qorunması;</Li>
          <Li>Şikayət və müraciətlərə 3 iş günü ərzində cavab vermək;</Li>
          <Li>Yeni xüsusiyyətlər əlavə etməzdən əvvəl istifadəçiləri məlumatlandırmaq.</Li>
        </ul>
      </Section>

      <Section title="6. Məsuliyyətin məhdudlaşdırılması">
        <p>
          HorecaHub.az istifadəçilər arasındakı əməliyyatlarda vasitəçi rolunu daşımır.
          Platforma satıcı ilə alıcı arasındakı əqdlər üçün, o cümlədən:
        </p>
        <ul className="space-y-2 mt-2">
          <Li>Malların keyfiyyəti, həqiqiliyi və ya çatdırılması üçün;</Li>
          <Li>Tərəflər arasında yarana biləcək mübahisələr üçün;</Li>
          <Li>Maliyyə zərərləri, itki mənfəəti və ya dolayı zərərlər üçün;</Li>
          <Li>Üçüncü tərəflərin hərəkətlərindən yaranan zərərlər üçün</Li>
        </ul>
        <p className="mt-3">məsuliyyət daşımır.</p>
        <p className="mt-3">
          Platforma yalnız elan yerləşdirmə və axtarış vasitəsini təqdim edir;
          bütün əməliyyatlar tərəflər arasında birbaşa həyata keçirilir.
        </p>
      </Section>

      <Section title="7. Hesabın ləğvi">
        <p>
          İstifadəçi istənilən vaxt hesabını bağlaya bilər. Hesab bağlandıqdan sonra
          aktiv elanlar deaktiv edilir, lakin mesajlar qeyd məqsədi ilə saxlanıla bilər.
        </p>
        <p>
          Platforma bu Şərtləri ciddi şəkildə pozduğu halda hesabı əvvəlcədən
          xəbərdarlıq etmədən bağlamaq hüququnu özündə saxlayır.
        </p>
      </Section>

      <Section title="8. Şərtlərin dəyişdirilməsi">
        <p>
          HorecaHub.az bu Şərtləri istənilən vaxt dəyişdirmək hüququnu özündə saxlayır.
          Əhəmiyyətli dəyişikliklər haqqında istifadəçilər e-poçt və ya platforma bildirişi
          vasitəsilə ən azı 14 gün əvvəl məlumatlandırılacaq.
        </p>
        <p>
          Dəyişiklikdən sonra platformadan istifadəyə davam etmək yeni şərtlərin qəbul edilməsi
          kimi qiymətləndirilir.
        </p>
      </Section>

      <Section title="9. Əlaqə">
        <p>
          Bu Şərtlərlə bağlı suallarınız üçün bizimlə əlaqə saxlayın:
        </p>
        <p className="mt-2">
          <strong className="text-navy">E-poçt:</strong> horecahub.az@gmail.com<br />
          <strong className="text-navy">Ünvan:</strong> Bakı, Azərbaycan
        </p>
      </Section>

      <div className="border-t border-gray-200 pt-8 mt-4 flex flex-col sm:flex-row gap-4 items-start">
        <Link to="/privacy" className="text-sm text-blue-600 hover:underline font-medium">
          Məxfilik Siyasəti →
        </Link>
        <Link to="/" className="text-sm text-gray-500 hover:text-navy">
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  )
}

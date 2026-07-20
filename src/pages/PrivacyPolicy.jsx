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

function Table({ rows }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {rows[0].map((h, i) => (
              <th key={i} className="text-left px-4 py-2.5 border border-gray-200 text-navy font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, i) => (
            <tr key={i} className="even:bg-gray-50/50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 border border-gray-200 text-gray-600">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <Helmet><title>Məxfilik siyasəti — HorecaHub</title></Helmet>
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-blue-600 tracking-widest uppercase mb-2">Hüquqi sənəd</p>
        <h1 className="text-3xl font-bold text-navy mb-3">Məxfilik Siyasəti</h1>
        <p className="text-sm text-gray-500">Son yenilənmə: 2026</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 mb-10 text-sm text-blue-800">
        HorecaHub.az olaraq şəxsi məlumatlarınıza olan hörməti ön planda tutururq.
        Bu siyasət hansı məlumatların toplandığını, necə istifadə edildiyini və hüquqlarınızı izah edir.
      </div>

      <Section title="1. Toplanan məlumatlar">
        <p>Siz qeydiyyatdan keçərkən və ya platforma ilə əlaqə saxlayarkən aşağıdakı məlumatlar toplanır:</p>

        <Table rows={[
          ['Məlumat növü', 'Nümunə', 'Toplanma səbəbi'],
          ['Ad Soyad', 'Əli Əliyev', 'Hesab yaratmaq, profil göstərmək'],
          ['E-poçt ünvanı', 'ali@example.com', 'Giriş, bildirişlər, əlaqə'],
          ['Telefon nömrəsi', '+994 50 XXX XX XX', 'Satıcı ilə əlaqə, doğrulama'],
          ['Şəhər', 'Bakı', 'Elan filtri, yerli axtarış'],
          ['Şirkət adı', 'HoreqTech MMC', 'Yalnız Təchizatçı hesabları üçün'],
          ['Elan məzmunu', 'Başlıq, qiymət, şəkil', 'Marketpleysdə nəşr etmək'],
        ]} />

        <p className="mt-4">
          Biz həmçinin texniki məlumatlar toplaya bilirik: IP ünvanı, brauzer növü,
          səhifə ziyarətləri (analitika məqsədi ilə). Bu məlumatlar şəxsi məlumat kimi
          qiymətləndirilmir.
        </p>
      </Section>

      <Section title="2. Məlumatların istifadəsi">
        <p>Topladığımız məlumatlar yalnız aşağıdakı məqsədlər üçün istifadə edilir:</p>
        <ul className="space-y-2 mt-2">
          <Li>Hesabınızı yaratmaq və idarə etmək;</Li>
          <Li>Elanlarınızı platformada nəşr etmək;</Li>
          <Li>Alıcı ilə satıcı arasında əlaqəni təmin etmək;</Li>
          <Li>Platforma xidmətləri ilə bağlı bildirişlər göndərmək (yeni mesaj, elan statusu);</Li>
          <Li>Platformanı təkmilləşdirmək üçün anonim analitika aparmaq;</Li>
          <Li>Qanuni tələblər yerinə yetirildikdə dövlət orqanlarının sorğularına cavab vermək.</Li>
        </ul>
        <p className="mt-3 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <strong className="text-navy">Vacib:</strong> Məlumatlarınız üçüncü tərəf reklam şirkətlərinə,
          marketinq agentliklərinə və ya başqa platformalara satılmır və paylaşılmır.
        </p>
      </Section>

      <Section title="3. Texnoloji altyapı — Supabase">
        <p>
          HorecaHub.az verilənlər bazası və autentifikasiya üçün <strong className="text-navy">Supabase</strong>
          xidmətindən istifadə edir.
        </p>
        <ul className="space-y-2 mt-2">
          <Li>Bütün məlumatlar Supabase serverlarında şifrələnmiş şəkildə saxlanılır;</Li>
          <Li>Supabase SOC 2 Type 2 sertifikatına malikdir;</Li>
          <Li>Məlumatlar AWS Frankfurt məlumat mərkəzlərində (EU-West-1 bölgəsi) saxlanıla bilər;</Li>
          <Li>Supabase məlumat emal edən (processor) rolunu daşıyır; məlumatların sahibi siz (istifadəçi) qalırsınız.</Li>
        </ul>
        <p className="mt-3">
          Supabase-in öz Məxfilik Siyasəti ilə tanış olmaq üçün{' '}
          <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer"
            className="text-blue-600 hover:underline">supabase.com/privacy</a>{' '}
          ünvanına daxil olun.
        </p>
      </Section>

      <Section title="4. Çərəzlər (Cookies)">
        <p>
          Platforma autentifikasiya sessiyası üçün zəruri texniki çərəzlər istifadə edir.
          Bu çərəzlər olmadan giriş funksionallığı işləmir.
        </p>
        <p>
          Biz marketinq və ya izləmə məqsədi ilə üçüncü tərəf çərəzlər istifadə etmirik.
        </p>
      </Section>

      <Section title="5. Məlumatların saxlanma müddəti">
        <ul className="space-y-2">
          <Li>Hesab məlumatları: hesabınız aktiv olduğu müddətcə saxlanılır;</Li>
          <Li>Silinmiş elanlar: status "deleted" olaraq işarələnir, fiziki olaraq 90 gün sonra silinir;</Li>
          <Li>Mesajlar: hesab bağlandıqdan 30 gün sonra silinir;</Li>
          <Li>Analitika məlumatları: anonim formada 24 ay saxlanıla bilər.</Li>
        </ul>
      </Section>

      <Section title="6. Məlumatlarınızın paylaşılması">
        <p>Məlumatlarınız yalnız aşağıdakı hallarda üçüncü tərəflərlə paylaşıla bilər:</p>
        <ul className="space-y-2 mt-2">
          <Li>
            <strong>Platforma xidmət provayderləri:</strong> Supabase (verilənlər bazası), texniki infrastruktur
            üçün — yalnız xidmət göstərməyə zəruri qədər;
          </Li>
          <Li>
            <strong>Qanuni tələblər:</strong> Azərbaycan Respublikasının qanunvericiliyi tərəfindən məcburi
            edildiyi hallarda (məhkəmə qərarı, prokuroruluq sorğusu);
          </Li>
          <Li>
            <strong>Elan məzmunu:</strong> Siz platforma elanı nəşr etdikdə başlıq, qiymət, şəkil və
            ödəniş növü ictimai olaraq görünür.
          </Li>
        </ul>
      </Section>

      <Section title="7. İstifadəçi hüquqları">
        <p>Azərbaycan Respublikasının qanunvericiliyi əsasında aşağıdakı hüquqlara maliksiniz:</p>
        <ul className="space-y-2 mt-2">
          <Li><strong className="text-navy">Məlumatla tanışlıq:</strong> Bizim haqqınızda saxladığımız məlumatların surətini tələb etmək;</Li>
          <Li><strong className="text-navy">Düzəliş:</strong> Yanlış məlumatların düzəldilməsini tələb etmək;</Li>
          <Li><strong className="text-navy">Silinmə:</strong> Məlumatlarınızın silinməsini tələb etmək ("unudulmaq hüququ");</Li>
          <Li><strong className="text-navy">Etiraz:</strong> Məlumatlarınızın müəyyən məqsədlər üçün emal edilməsinə etiraz etmək;</Li>
          <Li><strong className="text-navy">Köçürmə:</strong> Məlumatlarınızı maşın oxunaqlı formatda almaq.</Li>
        </ul>
        <p className="mt-3">
          Bu hüquqlardan istifadə etmək üçün <strong className="text-navy">horecahub.az@gmail.com</strong> ünvanına
          yazın. Sorğular 30 iş günü ərzində cavablandırılacaq.
        </p>
      </Section>

      <Section title="8. Uşaqların məlumatlarının qorunması">
        <p>
          HorecaHub.az 18 yaşından kiçik şəxslərə yönəlməyib. 18 yaşından kiçik şəxslərin
          məlumatlarını bilərəkdən toplamırıq. Əgər belə bir hal aşkar edilərsə, həmin məlumatlar
          dərhal silinəcək.
        </p>
      </Section>

      <Section title="9. Siyasətin dəyişdirilməsi">
        <p>
          Bu Məxfilik Siyasəti vaxtaşırı yenilənə bilər. Əhəmiyyətli dəyişikliklər haqqında
          qeydiyyatdan keçmiş istifadəçilər e-poçt vasitəsilə məlumatlandırılacaq.
        </p>
        <p>
          Dəyişiklikdən sonra platformadan istifadəyə davam etmək yenilənmiş siyasətin qəbul
          edilməsi kimi qiymətləndirilir.
        </p>
      </Section>

      <Section title="10. Bizimlə əlaqə">
        <p>Məxfilik məsələlərindəki suallarınız üçün:</p>
        <p className="mt-2">
          <strong className="text-navy">E-poçt:</strong> horecahub.az@gmail.com<br />
          <strong className="text-navy">Mövzu:</strong> "Məxfilik sorğusu"<br />
          <strong className="text-navy">Ünvan:</strong> Bakı, Azərbaycan
        </p>
      </Section>

      <div className="border-t border-gray-200 pt-8 mt-4 flex flex-col sm:flex-row gap-4 items-start">
        <Link to="/terms" className="text-sm text-blue-600 hover:underline font-medium">
          ← İstifadə Şərtləri
        </Link>
        <Link to="/" className="text-sm text-gray-500 hover:text-navy">
          Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  )
}

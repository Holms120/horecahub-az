import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Upload, AlertCircle, X, ImageOff } from 'lucide-react'
import {
  ChefHat, Coffee, Thermometer, UtensilsCrossed,
  LayoutGrid, Wine, Users, Truck, Briefcase, Monitor, GraduationCap,
  Package, Store, ShoppingBasket, Shirt, Wrench, Printer, HardHat, Scale,
  ShieldCheck,
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CITIES } from '../data/mockData'
import { useCategories } from '../hooks/useCategories'
import { useTranslation } from 'react-i18next'

const ICON_MAP  = { ChefHat, Coffee, Thermometer, UtensilsCrossed, LayoutGrid, Wine, Users, Truck, Briefcase, Monitor, GraduationCap, Package, Store, ShoppingBasket, Shirt, Wrench, Printer, HardHat, Scale, ShieldCheck }

const NO_CONDITION_categories = [
  'food_ingredients', 'hygiene', 'alcohol', 'soft_beverages', 'packaging', 'textile',
  'print_ads', 'legal_finance', 'consulting', 'software', 'training', 'staff',
  'maintenance', 'construction', 'suppliers', 'business_sale',
]
const EMPTY     = {
  category: '', subcategory: '', otherDescription: '',
  title: '', description: '', condition: 'Yeni', city: '', price: '', paymentType: 'cash',
  // Staff-specific
  listingType: 'cv', experienceYears: '', workType: 'full',
  skills: [], bio: '', certifications: '', requirements: '', companyNameVacancy: '',
}

function TagInput({ tags, onChange, skillsPlaceholder }) {
  const [input, setInput] = useState('')
  function addTag(val) {
    const t = val.replace(/,/g, '').trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }
  return (
    <div className="flex flex-wrap gap-1.5 p-3 border border-gray-200 rounded-xl min-h-[48px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white">
      {tags.map(t => (
        <span key={t} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
          {t}
          <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-red-600 leading-none">×</button>
        </span>
      ))}
      <input type="text" value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown} onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? skillsPlaceholder : ''}
        className="flex-1 min-w-[140px] outline-none text-sm bg-transparent" />
    </div>
  )
}
const MAX_FILES     = 5
const MAX_MB        = 5
const ALLOWED       = ['jpg', 'jpeg', 'png', 'webp']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const CATEGORY_PLACEHOLDERS = {
  kitchen:         { title: 'məs. Rational kombi-buxarlaşdırıcı SCC 61',          desc: 'Modeli, vəziyyəti, texniki xüsusiyyətləri, satış səbəbini yazın...' },
  coffee:          { title: 'məs. La Marzocco Linea PB 2-qrup espresso maşını',    desc: 'Modeli, neçə il istifadə olunub, texniki vəziyyəti...' },
  cold:            { title: 'məs. Liebherr GKv 4310 soyuducu',                     desc: 'Həcmi, temperaturu, vəziyyəti, neçə il istifadə olunub...' },
  tableware:       { title: 'məs. Porcelain boşqab dəsti, 50 ədəd',                desc: 'Material, ədəd sayı, vəziyyəti, markası...' },
  furniture:       { title: 'məs. Restoran üçün taxta stol dəsti, 4 nəfərlik',     desc: 'Material, ölçü, ədəd sayı, vəziyyəti...' },
  service:         { title: 'məs. Meiko UPster H500 sərvis avadanlığı',            desc: 'Model, texniki vəziyyəti, istifadə müddəti...' },
  packaging:       { title: 'məs. Kraft qablaşdırma qutuları, 500 ədəd',           desc: 'Ölçü, material, miqdar, qiymət...' },
  food_ingredients:{ title: 'məs. Matcha tozu, 1kq, premium grade',                desc: 'Marka, miqdar, mənşə, qablaşdırma...' },
  hygiene:         { title: 'məs. Latex əlcəklər, L ölçü, 100 ədəd',              desc: 'Marka, ölçü, miqdar, sertifikat...' },
  alcohol:         { title: 'məs. Evian mineral su, 0.5L, 24-lük qab',            desc: 'Marka, həcm, miqdar, çatdırılma şərtləri...' },
  textile:         { title: 'məs. Aşpaz forması dəsti, L ölçü, 10 ədəd',          desc: 'Material, ölçü, rəng, miqdar...' },
  maintenance:     { title: 'məs. Brita Purity C300 su filtr sistemi',             desc: 'Model, xidmət dairəsi, quraşdırma şərtləri...' },
  print_ads:       { title: 'məs. A1 formatında menyu çapı, 100 ədəd',            desc: 'Format, miqdar, material, çatdırılma müddəti...' },
  construction:    { title: 'məs. Restoran terras tenti, 5x10m',                  desc: 'Ölçü, material, quraşdırma xidməti, zəmanət...' },
  legal_finance:   { title: 'məs. Aylıq mühasibat xidməti, KOBİ üçün',           desc: 'Xidmət dairəsi, təcrübə, qiymət...' },
  consulting:      { title: 'məs. Restoran konsepsiyası hazırlanması',             desc: 'Xidmət dairəsi, təcrübə, portfel...' },
  software:        { title: 'məs. Restoran üçün POS sistem, bulud əsaslı',        desc: 'Funksionallıq, qiymət planı, dəstək...' },
  training:        { title: 'məs. Barista kursu, 2 həftə, Bakı',                  desc: 'Proqram, müddət, sertifikat, qiymət...' },
  staff:           { title: 'məs. Təcrübəli baş aşpaz, Avropa mətbəxi',           desc: 'Təcrübə, bacarıqlar, əmək haqqı gözləntiləri...' },
  business_sale:   { title: 'məs. İşlək kafe, Nərimanov, 60m², aylıq 8,000 AZN', desc: 'Dövriyyə, xərclər, avadanlıq, icarə müddəti...' },
}

const SUBCATEGORY_PLACEHOLDERS = {
  'convection_ovens':     { title: 'məs. Unox XVC 305E konveksion peç',                    desc: 'Model, güc, həcm, vəziyyəti, neçə il istifadə olunub...' },
  'combi_steamers':       { title: 'məs. Rational SCC 61 kombi-buxarlaşdırıcı',            desc: 'Model, qəfəs sayı, vəziyyəti, xidmət tarixi...' },
  'pizza_ovens':          { title: 'məs. Moretti Forni T64E pizza peçi',                   desc: 'Model, kamera sayı, temperatura, vəziyyəti...' },
  'fryers':               { title: 'məs. Henny Penny qızartma aparatı',                    desc: 'Model, həcm, güc, vəziyyəti...' },
  'stoves':               { title: 'məs. 6-qozlu qaz plitəsi, döküm qəfəs',               desc: 'Qoz sayı, yanacaq növü, vəziyyəti...' },
  'mixers_blenders':      { title: 'məs. Robot Coupe R301 blender',                        desc: 'Model, güc, həcm, aksessuarlar, vəziyyəti...' },
  'meat_equipment':       { title: 'məs. Tre Spade sümük mişarı',                          desc: 'Model, güc, vəziyyəti, istifadə müddəti...' },
  'slicers':              { title: 'məs. Berkel 250 ət dilimləyici',                        desc: 'Model, bıçaq diametri, vəziyyəti...' },
  'water_baths':          { title: 'məs. Sous vide vanası, 20L',                            desc: 'Həcm, temperatura diapazon, vəziyyəti...' },
  'pasta_cookers':        { title: 'məs. Pasta bişirici, 40L',                             desc: 'Həcm, material, vəziyyəti...' },
  'kitchen_spare_parts':  { title: 'məs. Rational ehtiyat hissəsi, model nömrəsi',         desc: 'Cihaz modeli, hissənin adı, orijinallıq...' },
  'kitchen_other':        { title: 'məs. Profesional mətbəx avadanlığı',                   desc: 'Növ, model, vəziyyəti, xüsusiyyətləri...' },
  'espresso_machines':    { title: 'məs. La Marzocco Linea PB 2-qrup',                    desc: 'Model, qrup sayı, vəziyyəti, xidmət tarixi...' },
  'grinders':             { title: 'məs. Mahlkönig EK43 üyüdücü',                          desc: 'Model, bıçaq diametri, vəziyyəti...' },
  'brewing_equipment':    { title: 'məs. Chemex, Hario V60, batch brew',                   desc: 'Növ, ölçü, vəziyyəti...' },
  'refrigerators_bar':    { title: 'məs. Vitrin soyuducu, 120L',                           desc: 'Həcm, ölçü, vəziyyəti...' },
  'ice_machines':         { title: 'məs. Scotsman buz maşını, 30kq/gün',                   desc: 'Model, gündəlik istehsal, vəziyyəti...' },
  'bar_equipment':        { title: 'məs. Profesional blender, şüşə kasa',                  desc: 'Model, güc, vəziyyəti...' },
  'coffee_other':         { title: 'məs. Qəhvə & bar avadanlığı',                          desc: 'Növ, model, vəziyyəti...' },
  'refrigerators':        { title: 'məs. Liebherr GKv 4310 soyuducu',                      desc: 'Həcm, temperatura, vəziyyəti...' },
  'freezers':             { title: 'məs. Derin dondurucu, 500L',                           desc: 'Həcm, temperatura, vəziyyəti...' },
  'display_fridges':      { title: 'məs. Şüşəli vitrin soyuducu, 3 qapılı',               desc: 'Ölçü, temperatura, vəziyyəti...' },
  'blast_chillers':       { title: 'məs. Hızlı soyutucu, 10 GN tava',                     desc: 'Tava sayı, soyutma sürəti, vəziyyəti...' },
  'cold_other':           { title: 'məs. Soyutma avadanlığı',                              desc: 'Növ, həcm, vəziyyəti...' },
  'plates_bowls':         { title: 'məs. Porcelain boşqab dəsti, 50 ədəd',                desc: 'Material, ölçü, ədəd sayı, marka...' },
  'glasses':              { title: 'məs. Riedel şərab kadehləri, 24 ədəd',                 desc: 'Növ, həcm, ədəd sayı, vəziyyəti...' },
  'cutlery':              { title: 'məs. 84 parçalı gümüş dəst',                           desc: 'Material, parça sayı, marka, vəziyyəti...' },
  'serving_equipment':    { title: 'məs. Servis arabası, 3 mərtəbəli',                     desc: 'Ölçü, material, vəziyyəti...' },
  'tableware_other':      { title: 'məs. Qab-qacaq və aksesuar',                           desc: 'Növ, material, miqdar, vəziyyəti...' },
  'tables_chairs':        { title: 'məs. 4 nəfərlik masa dəsti + 4 stul',                  desc: 'Material, ölçü, rəng, ədəd sayı, vəziyyəti...' },
  'bar_counters':         { title: 'məs. Bar steyci, 3 metr, paslanmaz polad',             desc: 'Uzunluq, material, vəziyyəti...' },
  'shelving':             { title: 'məs. Paslanmaz polad rəf, 5 mərtəbəli',                desc: 'Ölçü, yük tutumu, material, vəziyyəti...' },
  'lounge_furniture':     { title: 'məs. Divan dəsti, restoran üçün',                      desc: 'Material, ölçü, rəng, vəziyyəti...' },
  'furniture_other':      { title: 'məs. Mebel və dekor əşyası',                           desc: 'Növ, material, vəziyyəti...' },
  'gloves_masks':         { title: 'məs. Latex əlcəklər, L ölçü, 100 ədəd',               desc: 'Marka, ölçü, miqdar, sertifikat...' },
  'disinfectants':        { title: 'məs. Suma dezinfektan, 5L',                            desc: 'Marka, həcm, miqdar...' },
  'cleaning_products':    { title: 'məs. Profesional mətbəx təmizlik dəsti',               desc: 'Marka, növ, miqdar...' },
  'soap_paper':           { title: 'məs. Kağız dəsmal, 6 rulon, ağ',                       desc: 'Növ, miqdar, marka...' },
  'haccp_materials':      { title: 'məs. HACCP üçün rəngli kəsici taxta dəsti',            desc: 'Dəst tərkibi, standart, miqdar...' },
  'hygiene_other':        { title: 'məs. Gigiyena məhsulu',                                desc: 'Növ, miqdar, istifadə sahəsi...' },
  'wine':                 { title: 'məs. Yerli şərab, Madrasa, 2023, 6 şüşə',             desc: 'Marka, il, həcm, miqdar...' },
  'beer':                 { title: 'məs. Xdraft pivə sistemi, keg, 30L',                   desc: 'Marka, həcm, miqdar, çatdırılma...' },
  'spirits':              { title: 'məs. Whisky, 0.7L, 12 şüşə',                           desc: 'Marka, həcm, miqdar...' },
  'soft_drinks':          { title: 'məs. Coca-Cola, 0.33L, 24-lük qab',                   desc: 'Marka, həcm, miqdar, çatdırılma...' },
  'energy_drinks':        { title: 'məs. Red Bull, 0.25L, 24-lük qab',                    desc: 'Marka, həcm, miqdar...' },
  'water':                { title: 'məs. Evian mineral su, 0.5L, 24-lük',                  desc: 'Marka, həcm, miqdar, çatdırılma...' },
  'juice':                { title: 'məs. Təzə sıxılmış portağal şirəsi, 1L',              desc: 'Növ, həcm, miqdar, istehsal tarixi...' },
  'alcohol_other':        { title: 'məs. İçki məhsulu',                                   desc: 'Növ, marka, həcm, miqdar...' },
  'chef_uniform':         { title: 'məs. Aşpaz forması dəsti, M ölçü, 5 ədəd',            desc: 'Material, ölçü, rəng, miqdar...' },
  'waiter_uniform':       { title: 'məs. Ofisiant forması, qara, S/M/L',                   desc: 'Material, ölçü, rəng, miqdar...' },
  'aprons':               { title: 'məs. Dəri önlük, baristaçı üçün',                      desc: 'Material, ölçü, rəng, miqdar...' },
  'hotel_textile':        { title: 'məs. Otel dəsmalı dəsti, 50 ədəd',                    desc: 'Ölçü, material, miqdar...' },
  'table_cloth':          { title: 'məs. Ziqzaq masa örtüyü, 10 ədəd',                    desc: 'Ölçü, material, rəng, miqdar...' },
  'textile_other':        { title: 'məs. Tekstil məhsulu',                                 desc: 'Növ, material, ölçü, miqdar...' },
  'equipment_repair':     { title: 'məs. Espresso maşını təmiri, Bakı',                    desc: 'Cihaz növü, xidmət dairəsi, zəmanət...' },
  'refrigeration_service':{ title: 'məs. Soyuducu texniki baxım xidməti',                 desc: 'Xidmət növü, müddət, qiymət...' },
  'plumbing':             { title: 'məs. Santexnika quraşdırma və təmir',                  desc: 'Xidmət növü, bölgə, təcrübə...' },
  'electrical':           { title: 'məs. Restoran üçün elektrik işləri',                   desc: 'Xidmət növü, bölgə, lisenziya...' },
  'ventilation':          { title: 'məs. Mətbəx ventilyasiya sistemi quraşdırma',          desc: 'Sistem növü, güc, sahə, qiymət...' },
  'filter_water':         { title: 'məs. Brita Purity C300 su filtr quraşdırma',           desc: 'Model, filtrasiya həcmi, quraşdırma xidməti...' },
  'maintenance_other':    { title: 'məs. Texniki xidmət',                                  desc: 'Xidmət növü, bölgə, təcrübə...' },
  'menu_print':           { title: 'məs. A4 laminat menyu, 100 ədəd, 2 tərəfli',           desc: 'Format, miqdar, material, çatdırılma müddəti...' },
  'banner_signage':       { title: 'məs. 3x1m banner çapı, çərçivə ilə',                   desc: 'Ölçü, material, miqdar...' },
  'brand_materials':      { title: 'məs. Kafe üçün korporativ üslub paketi',               desc: 'Xidmət dairəsi, format, müddət...' },
  'business_cards':       { title: 'məs. Vizit kart, 500 ədəd, 2 tərəfli',                desc: 'Format, material, miqdar, çatdırılma...' },
  'digital_ads':          { title: 'məs. Instagram/Facebook reklam idarəetməsi',           desc: 'Platforma, büdcə, müddət, hədəf...' },
  'print_other':          { title: 'məs. Çap xidməti',                                     desc: 'Növ, format, miqdar...' },
  'interior_design':      { title: 'məs. Restoran interyer dizaynı, 120m²',                desc: 'Sahə, üslub, müddət, portfel...' },
  'renovation':           { title: 'məs. Kafe təmiri açar altına, 60m²',                   desc: 'Sahə, iş dairəsi, müddət, zəmanət...' },
  'engineering':          { title: 'məs. Mətbəx mühəndislik layihəsi',                     desc: 'Xidmət növü, təcrübə, lisenziya...' },
  'furniture_custom':     { title: 'məs. Sifarişli bar steyci, paslanmaz polad',            desc: 'Material, ölçü, müddət, portfel...' },
  'terrace_outdoor':      { title: 'məs. Restoran terras tenti, 5x10m',                    desc: 'Ölçü, material, quraşdırma, zəmanət...' },
  'construction_other':   { title: 'məs. İnşaat xidməti',                                  desc: 'Xidmət növü, bölgə, müddət...' },
  'accounting':           { title: 'məs. KOBİ üçün aylıq mühasibat xidməti',              desc: 'Xidmət dairəsi, hesabat növü, qiymət...' },
  'tax_consulting':       { title: 'məs. ƏDV keçidi üçün vergi məsləhəti',                desc: 'Məsələ, xidmət müddəti, qiymət...' },
  'legal_service':        { title: 'məs. İcarə müqaviləsi hazırlanması',                   desc: 'Xidmət növü, müddət, qiymət...' },
  'licensing':            { title: 'məs. Restoran fəaliyyəti üçün lisenziya',              desc: 'Lisenziya növü, müddət, xidmət...' },
  'hr_service':           { title: 'məs. Əmək müqaviləsi + HR xidməti',                   desc: 'Xidmət dairəsi, işçi sayı, qiymət...' },
  'legal_other':          { title: 'məs. Maliyyə/hüquq xidməti',                           desc: 'Xidmət növü, sahə, qiymət...' },
  'chef':                 { title: 'məs. Baş aşpaz, Avropa mətbəxi, 5 il təcrübə',        desc: 'Mövqe, təcrübə, maaş gözləntiləri, hazırlıq...' },
  'barista':              { title: 'məs. Specialty coffee barista, SCA sertifikatlı',       desc: 'Sertifikat, təcrübə, maaş gözləntiləri...' },
  'waiter':               { title: 'məs. Ofisiant, ingilis dili bilən, Bakı',              desc: 'Dil bilikləri, təcrübə, şəhər...' },
  'manager':              { title: 'məs. Restoran meneceri, 3+ il təcrübə',                desc: 'Vəzifə, təcrübə, maaş gözləntiləri...' },
  'staff_other':          { title: 'məs. HoReCa sektorunda işçi',                          desc: 'Vəzifə, təcrübə, tələblər...' },
  'cafe_sale':            { title: 'məs. İşlək coffee shop, Nərimanov, 40m²',             desc: 'Aylıq dövriyyə, xərclər, icarə qiyməti, avadanlıq...' },
  'restaurant_sale':      { title: 'məs. Restoran, 80 oturacaq, tam avadanlıqlı',          desc: 'Oturacaq sayı, dövriyyə, icarə, avadanlıq...' },
  'business_other':       { title: 'məs. Biznes satışı',                                   desc: 'Dövriyyə, xərclər, aktivlər, satış səbəbi...' },
  'coffee_beans':         { title: 'məs. Ethiopia Yirgacheffe, 1kq, specialty',            desc: 'Mənşə, emal üsulu, kavurma dərəcəsi, miqdar...' },
  'alternative_milk':     { title: 'məs. Oat milk, Oatly barista, 6x1L',                   desc: 'Marka, növ, həcm, miqdar...' },
  'matcha':               { title: 'məs. Ippodo Matcha, ceremonial grade, 100q',            desc: 'Marka, keyfiyyət dərəcəsi, miqdar, qiymət...' },
  'chocolate_powder':     { title: 'məs. Valrhona kakao tozu, 1kq',                        desc: 'Marka, növ, miqdar, qiymət...' },
  'salep':                { title: 'məs. Türk sahlep tozu, 500q, orjinal',                 desc: 'Mənşə, miqdar, qablaşdırma...' },
  'chai_tea':             { title: 'məs. Masala chai qarışığı, 1kq',                       desc: 'Tərkib, miqdar, marka...' },
  'syrups_toppings':      { title: 'məs. Monin karamel sirop, 700ml',                      desc: 'Marka, ləzzət, həcm, miqdar...' },
  'flour_sugar':          { title: 'məs. Premium un, 25kq, çörəkçilik üçün',              desc: 'Növ, çəki, miqdar, istehsalçı...' },
  'spices':               { title: 'məs. Profesional ədviyyat dəsti, 12 növ',              desc: 'Növ sayı, miqdar, istehsalçı...' },
  'food_other':           { title: 'məs. Yeyinti məhsulu',                                 desc: 'Növ, miqdar, saxlama şərtləri...' },
  'boxes':                { title: 'məs. Pizza qutusu, 30cm, 100 ədəd',                    desc: 'Ölçü, material, çap, miqdar...' },
  'bags':                 { title: 'məs. Kraft çanta, tutaclı, 500 ədəd',                  desc: 'Ölçü, material, çap, miqdar...' },
  'cups':                 { title: 'məs. Kağız stəkan, 350ml, 1000 ədəd',                  desc: 'Həcm, material, miqdar, çap...' },
  'packaging_other':      { title: 'məs. Qablaşdırma materialı',                           desc: 'Növ, ölçü, miqdar...' },
}

const strip = v => (v || '').replace(/<[^>]*>/g, '').trim()

export default function AddListing() {
  const { t } = useTranslation()
  const [step, setStep]           = useState(0)
  const [form, setForm]           = useState(EMPTY)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews]   = useState([])
  const [imageError, setImageError] = useState('')
  const [stepErrors, setStepErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [feedbackStep, setFeedbackStep] = useState(false)
  const [feedbackData, setFeedbackData] = useState({ type: 'suggestion', message: '' })
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [userProfile, setUserProfile] = useState(null)
  const { categories, subcategories } = useCategories()

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/sell' } })
    }
  }, [user, authLoading, navigate])

  const STEPS = [
    t('addListing.step1'), t('addListing.step2'), t('addListing.step3'),
    t('addListing.step4'), t('addListing.step5')
  ]

  const PAYMENT_OPTS = [
    { value: 'cash',   label: t('addListing.cash') },
    { value: 'credit', label: t('addListing.credit') },
    { value: 'order',  label: t('addListing.order') },
  ]

  const EXPERIENCE_OPTS = [
    { value: '',       label: t('addListing.selectExp') },
    { value: 'less_1', label: t('listingDetail.exp1') },
    { value: '1_2',    label: t('listingDetail.exp2') },
    { value: '3_5',    label: t('listingDetail.exp3') },
    { value: '5_10',   label: t('listingDetail.exp4') },
    { value: '10_plus',label: t('listingDetail.exp5') },
  ]

  const WORK_TYPE_OPTS = [
    { value: 'full', label: t('addListing.fullTime') },
    { value: 'part', label: t('addListing.partTime') },
    { value: 'both', label: t('addListing.both') },
  ]

  // Fetch user profile for supplier check
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('account_type').eq('id', user.id).single()
      .then(({ data }) => setUserProfile(data))
  }, [user])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    if (NO_CONDITION_categories.includes(form.category)) {
      setForm(f => ({ ...f, condition: 'Yeni' }))
    }
  }, [form.category])

  function getDescPlaceholder() {
    if (form.category === 'training')      return t('addListing.descPlaceholderTraining')
    if (form.category === 'consulting')    return t('addListing.descPlaceholderConsulting')
    if (form.category === 'software')      return t('addListing.descPlaceholderSoftware')
    if (form.category === 'business_sale') return t('addListing.descPlaceholderBusiness')
    return t('addListing.descPlaceholder')
  }

  const placeholder =
    (form.subcategory && SUBCATEGORY_PLACEHOLDERS[form.subcategory]) ||
    CATEGORY_PLACEHOLDERS[form.category] ||
    { title: t('addListing.titlePlaceholderDefault'), desc: t('addListing.descPlaceholder') }

  function handleFileChange(e) {
    const incoming = Array.from(e.target.files)
    const slots    = MAX_FILES - selectedFiles.length
    if (slots <= 0) return

    let firstError = ''
    const valid = []

    for (const file of incoming) {
      if (valid.length >= slots) break
      const ext = file.name.split('.').pop().toLowerCase()
      if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED.includes(ext)) {
        firstError = t('addListing.errFormat')
        continue
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        firstError = t('addListing.errSize')
        continue
      }
      valid.push(file)
    }

    setImageError(firstError)
    if (!valid.length) return

    const combined = [...selectedFiles, ...valid]
    previews.forEach(url => URL.revokeObjectURL(url))
    setSelectedFiles(combined)
    setPreviews(combined.map(f => URL.createObjectURL(f)))
    e.target.value = ''
  }

  function removeFile(i) {
    URL.revokeObjectURL(previews[i])
    const newFiles = selectedFiles.filter((_, idx) => idx !== i)
    const newPrevs = previews.filter((_, idx) => idx !== i)
    setSelectedFiles(newFiles)
    setPreviews(newPrevs)
    if (imageError) setImageError('')
    if (stepErrors.images) clearErr('images')
  }

  function getStepErrors() {
    const e = {}
    if (step === 1) {
      if (strip(form.title).length < 5) e.title = t('addListing.errTitle')
      if (!form.city) e.city = t('addListing.errCity')
      if (!NO_CONDITION_categories.includes(form.category) && !form.condition) e.condition = t('addListing.errCondition')
      if (form.category === 'staff') {
        if (!form.experienceYears) e.experienceYears = t('addListing.errExp')
        if (form.listingType === 'cv' && strip(form.bio).length < 20)
          e.bio = t('addListing.errAbout')
        if (form.listingType === 'vacancy' && strip(form.requirements).length < 20)
          e.requirements = t('addListing.errReq')
      }
    }
    if (step === 2) {
      if (form.category !== 'staff' && selectedFiles.length === 0)
        e.images = t('addListing.errPhoto')
    }
    if (step === 3) {
      if (Number(form.price) < 1)
        e.price = form.category === 'staff' ? t('addListing.errSalary') : t('addListing.errPrice')
    }
    return e
  }

  function clearErr(field) {
    setStepErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  function canProceed() {
    if (step === 0) {
      if (!form.category) return false
      if (form.category === 'suppliers' && userProfile && userProfile.account_type !== 'supplier') return false
      const subs = subcategories[form.category]
      if (subs?.length && !form.subcategory) return false
      return true
    }
    return Object.keys(getStepErrors()).length === 0
  }

  async function handleSubmit() {
    if (!user) {
      navigate('/login', { state: { from: '/sell' } })
      return
    }
    setSubmitting(true)
    setSubmitError('')

    const imageUrls = []
    for (const file of selectedFiles) {
      const ext      = file.name.split('.').pop().toLowerCase()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('listings')
        .upload(fileName, file, { contentType: file.type })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('listings').getPublicUrl(fileName)
        imageUrls.push(urlData.publicUrl)
      }
    }

    const { error } = await supabase.from('listings').insert({
      user_id:      user.id,
      title:        strip(form.title),
      description:  strip(form.description),
      price:        Number(form.price),
      payment_type: form.paymentType,
      category:          form.category,
      subcategory:       form.subcategory || null,
      other_description: form.subcategory?.endsWith('_other') && form.otherDescription ? strip(form.otherDescription) : null,
      listing_type:      form.category === 'staff' ? form.listingType : 'item',
      experience_years:  form.category === 'staff' && form.experienceYears ? form.experienceYears : null,
      work_type:         form.category === 'staff' && form.workType ? form.workType : null,
      skills:            form.category === 'staff' && form.skills.length > 0 ? form.skills : null,
      bio:               form.category === 'staff' && form.listingType === 'cv' ? strip(form.bio) || null : null,
      certifications:    form.category === 'staff' && form.listingType === 'cv' ? strip(form.certifications) || null : null,
      requirements:      form.category === 'staff' && form.listingType === 'vacancy' ? strip(form.requirements) || null : null,
      condition:    form.condition === 'Yeni' ? 'new' : 'used',
      city:         form.city,
      images:       imageUrls,
      status:       'pending',
    })

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
    } else {
      setSubmitting(false)
      setFeedbackStep(true)
    }
  }

  async function handleFeedbackSubmit() {
    if (feedbackData.message.trim()) {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || null
      await supabase.from('feedback').insert({
        user_id: userId,
        type: feedbackData.type,
        message: feedbackData.message.trim(),
        context: 'listing_create',
      })
    }
    window.location.href = '/'
  }

  function handleFeedbackSkip() {
    window.location.href = '/'
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🕐</span>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-3">{t('addListing.pendingTitle')}</h2>
        <p className="text-gray-500 mb-8">{t('addListing.pendingDesc')}</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/listings')}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
            {t('addListing.viewListings')}
          </button>
          <button onClick={() => { setForm(EMPTY); setSelectedFiles([]); setPreviews([]); setImageError(''); setStep(0); setSubmitted(false) }}
            className="w-full py-3 border border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50">
            {t('addListing.postAnother')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-navy mb-8">{t('addListing.title')}</h1>

      {!user && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3 text-sm text-yellow-800">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            {t('addListing.loginRequired')}{' '}
            <button onClick={() => navigate('/login', { state: { from: '/sell' } })}
              className="font-semibold underline hover:no-underline">{t('addListing.loginLink')}</button>
          </span>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center gap-1 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step   ? 'bg-blue-600 text-white' :
                i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs mt-1 hidden sm:block whitespace-nowrap ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-3 transition-colors ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">

        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-navy mb-6">{t('addListing.selectCategory')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map(cat => {
                const Icon = ICON_MAP[cat.icon]
                return (
                  <button key={cat.id} type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat.id, subcategory: '' }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      form.category === cat.id
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-blue-300 text-gray-600'
                    }`}>
                    {Icon && <Icon size={22} />}
                    <span className="text-xs font-medium text-center leading-tight">{t(cat.key) || cat.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Subcategory selector */}
            {form.category && subcategories[form.category]?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-navy mb-3">{t('addListing.subcategory')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subcategories[form.category].map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        subcategory:     sub.id,
                        otherDescription: '',
                        ...(['staff', 'consulting', 'software', 'training', 'business_sale'].includes(f.category)
                          ? { title: subcategories[f.category]?.find(s => s.id === sub.id)?.label || '' }
                          : {}),
                      }))}
                      className={`text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${
                        form.subcategory === sub.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-blue-300 text-gray-600'
                      }`}
                    >
                      {t('subcat.' + sub.id) || sub.label}
                    </button>
                  ))}
                </div>
                {/* "Digər" free-text input */}
                {form.subcategory?.endsWith('_other') && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-600 mb-1.5">
                      {t('addListing.otherDesc')}
                    </label>
                    <input type="text" value={form.otherDescription}
                      onChange={e => set('otherDescription', e.target.value)}
                      placeholder={t('addListing.otherPlaceholder')}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                )}
              </div>
            )}

            {/* Suppliers restriction warning */}
            {form.category === 'suppliers' && userProfile && userProfile.account_type !== 'supplier' && (
              <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-sm text-amber-800">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {t('addListing.suppliersOnly')}
              </div>
            )}

          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-navy mb-2">{t('addListing.listingDetails')}</h2>

            {/* CV / Vacancy selector — staff only, shown BEFORE title */}
            {form.category === 'staff' && (
              <div className="pb-2">
                <h3 className="text-sm font-semibold text-navy mb-3">{t('addListing.listingFor')}</h3>
                <div className="flex gap-3">
                  {[
                    { value: 'cv',      label: t('addListing.cv'),      desc: t('addListing.cvSub') },
                    { value: 'vacancy', label: t('addListing.vacancy'),  desc: t('addListing.vacancySub') },
                  ].map(({ value, label, desc }) => (
                    <label key={value} className={`flex-1 flex flex-col gap-0.5 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.listingType === value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}>
                      <input type="radio" name="listingType" value={value} checked={form.listingType === value}
                        onChange={() => set('listingType', value)} className="sr-only" />
                      <span className={`text-sm font-semibold ${form.listingType === value ? 'text-blue-700' : 'text-gray-700'}`}>{label}</span>
                      <span className="text-xs text-gray-400">{desc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Title input — hidden for staff and service categories (auto-set from subcategory) */}
            {!['staff', 'consulting', 'software', 'training', 'business_sale'].includes(form.category) && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.titleLabel')}</label>
                <input type="text" value={form.title}
                  placeholder={placeholder.title}
                  maxLength={80}
                  onChange={e => { set('title', e.target.value); clearErr('title') }}
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${stepErrors.title ? 'border-red-400' : 'border-gray-200'}`} />
                <div className="flex justify-between mt-1">
                  {stepErrors.title ? <p className="text-red-500 text-xs">{stepErrors.title}</p> : <span />}
                  <p className="text-xs text-gray-400">{form.title.length}/80</p>
                </div>
              </div>
            )}
            {form.category !== 'staff' && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.description')}</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder={placeholder.desc}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
              </div>
            )}
            {!NO_CONDITION_categories.includes(form.category) && (
              <div>
                <label className="block text-sm font-medium text-navy mb-2">{t('addListing.condition')}</label>
                <div className="flex gap-3">
                  {['Yeni', 'İşlənmiş'].map(c => (
                    <label key={c} className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
                      form.condition === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                    }`}>
                      <input type="radio" name="condition" value={c} checked={form.condition === c}
                        onChange={() => set('condition', c)} className="sr-only" />
                      {c === 'Yeni' ? t('addListing.new') : t('addListing.used')}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.city')}</label>
              <select value={form.city}
                onChange={e => { set('city', e.target.value); clearErr('city') }}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white ${stepErrors.city ? 'border-red-400' : 'border-gray-200'}`}>
                <option value="">{t('addListing.selectCity')}</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {stepErrors.city && <p className="text-red-500 text-xs mt-1">{stepErrors.city}</p>}
            </div>

            {/* Staff-specific fields */}
            {form.category === 'staff' && (
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h3 className="text-sm font-semibold text-navy">
                  {form.listingType === 'cv' ? t('addListing.cvSection') : t('addListing.vacancySection')}
                </h3>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">
                    {form.listingType === 'cv' ? t('addListing.experience') : t('addListing.requiredExp')}
                  </label>
                  <select value={form.experienceYears}
                    onChange={e => { set('experienceYears', e.target.value); clearErr('experienceYears') }}
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white ${stepErrors.experienceYears ? 'border-red-400' : 'border-gray-200'}`}>
                    {EXPERIENCE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {stepErrors.experienceYears && <p className="text-red-500 text-xs mt-1">{stepErrors.experienceYears}</p>}
                </div>

                {/* Work type */}
                <div>
                  <label className="block text-sm font-medium text-navy mb-2">{t('addListing.workType')}</label>
                  <div className="flex gap-3">
                    {WORK_TYPE_OPTS.map(({ value, label }) => (
                      <label key={value} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border-2 cursor-pointer text-sm transition-all ${
                        form.workType === value ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600'
                      }`}>
                        <input type="radio" name="workType" value={value} checked={form.workType === value}
                          onChange={() => set('workType', value)} className="sr-only" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {form.listingType === 'cv' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.skills')}</label>
                      <TagInput tags={form.skills} onChange={v => set('skills', v)} skillsPlaceholder={t('addListing.skillsPlaceholder')} />
                      <p className="text-xs text-gray-400 mt-1">{t('addListing.skillsHint')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">
                        {t('addListing.about')}
                      </label>
                      <textarea value={form.bio}
                        onChange={e => { set('bio', e.target.value); clearErr('bio') }}
                        placeholder={t('addListing.aboutPlaceholder')} rows={3} maxLength={500}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none ${stepErrors.bio ? 'border-red-400' : 'border-gray-200'}`} />
                      <div className="flex justify-between mt-1">
                        {stepErrors.bio ? <p className="text-red-500 text-xs">{stepErrors.bio}</p> : <span />}
                        <p className="text-xs text-gray-400">{form.bio.length}/500</p>
                      </div>
                    </div>
                    {form.listingType !== 'vacancy' && (
                      <div>
                        <label className="block text-sm font-medium text-navy mb-1.5">
                          {t('addListing.certifications')}
                        </label>
                        <input type="text" value={form.certifications} onChange={e => set('certifications', e.target.value)}
                          placeholder={t('addListing.certPlaceholder')}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.requirements')}</label>
                      <textarea value={form.requirements}
                        onChange={e => { set('requirements', e.target.value); clearErr('requirements') }}
                        placeholder={t('addListing.reqPlaceholder')} rows={3}
                        className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none ${stepErrors.requirements ? 'border-red-400' : 'border-gray-200'}`} />
                      {stepErrors.requirements && <p className="text-red-500 text-xs mt-1">{stepErrors.requirements}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1.5">
                        {t('addListing.companyName')}
                      </label>
                      <input type="text" value={form.companyNameVacancy} onChange={e => set('companyNameVacancy', e.target.value)}
                        placeholder={t('addListing.companyPlaceholder')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-navy">
                {form.category === 'staff' && form.listingType === 'cv'
                  ? t('addListing.photosCVTitle')
                  : form.category === 'staff'
                  ? t('addListing.photosVacancyTitle')
                  : t('addListing.photosTitle')}
              </h2>
              <span className="text-sm font-semibold text-gray-500">
                {selectedFiles.length}/{MAX_FILES}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {form.category === 'staff' && form.listingType === 'cv'
                ? t('addListing.photosCVSubtitle')
                : form.category === 'staff'
                ? t('addListing.photosVacancySubtitle')
                : t('addListing.photosHint')}
            </p>

            {imageError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
                <AlertCircle size={14} className="flex-shrink-0" />
                {imageError}
              </div>
            )}

            {selectedFiles.length < MAX_FILES && (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mb-4">
                <Upload size={28} className="text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-600">{t('addListing.selectPhotos')}</span>
                <span className="text-xs text-gray-400 mt-0.5">
                  {selectedFiles.length > 0
                    ? t('addListing.morePhotos', { count: MAX_FILES - selectedFiles.length })
                    : t('addListing.photoTypes')}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}

            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        {t('addListing.mainPhoto')}
                      </span>
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                    >
                      <X size={11} className="text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previews.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700">
                <ImageOff size={14} />
                {t('addListing.noPhotoWarning')}
              </div>
            )}
            {stepErrors.images && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mt-3">
                <AlertCircle size={14} className="flex-shrink-0" />
                {stepErrors.images}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Price */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-navy mb-2">
              {form.category === 'staff' ? t('addListing.salaryLabel').split('(')[0].trim().replace(' *','').trim() : t('addListing.reviewPrice')}
            </h2>
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">
                {form.category === 'staff' ? t('addListing.salaryLabel') : t('addListing.priceLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₼</span>
                <input
                  type="number"
                  min="1"
                  placeholder={form.category === 'staff' ? t('addListing.salaryPlaceholder') : '0'}
                  value={form.price}
                  onChange={e => { set('price', e.target.value); clearErr('price') }}
                  className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${stepErrors.price ? 'border-red-400' : 'border-gray-200'}`}
                />
              </div>
              {stepErrors.price && <p className="text-red-500 text-xs mt-1">{stepErrors.price}</p>}
            </div>
            {!NO_CONDITION_categories.includes(form.category) && (
              <div>
                <label className="block text-sm font-medium text-navy mb-3">{t('addListing.paymentType')}</label>
                <div className="flex flex-col gap-2">
                  {PAYMENT_OPTS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                        form.paymentType === value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        value={value}
                        checked={form.paymentType === value}
                        onChange={() => set('paymentType', value)}
                        className="accent-blue-600"
                      />
                      <span className={`text-sm font-medium ${form.paymentType === value ? 'text-blue-700' : 'text-gray-700'}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-navy mb-6">{t('addListing.reviewTitle')}</h2>
            {submitError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertCircle size={15} /> {submitError}
              </div>
            )}
            {!user && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                {t('addListing.loginWarning')}{' '}
                <button onClick={() => navigate('/login', { state: { from: '/sell' } })}
                  className="font-semibold underline">{t('auth.loginLink')}</button>.
              </div>
            )}
            <div className="divide-y divide-gray-100">
              {[
                { label: t('addListing.reviewCategory'),    value: (() => { const c = categories.find(c => c.id === form.category); return c ? (t(c.key) || c.label) : '—' })() },
                ...(subcategories[form.category]?.length > 0
                  ? [{ label: t('addListing.reviewSubcategory'), value: (() => { const s = subcategories[form.category]?.find(s => s.id === form.subcategory); return s ? (t(s.key) || s.label) : '—' })() }]
                  : []
                ),
                { label: t('addListing.reviewTitle2'),      value: strip(form.title) || '—' },
                { label: t('addListing.reviewCondition'),   value: form.condition },
                { label: t('addListing.reviewCity'),        value: form.city || '—' },
                { label: t('addListing.reviewPhotos'),      value: selectedFiles.length > 0 ? `${selectedFiles.length}/${MAX_FILES}` : t('addListing.noPhotos') },
                { label: t('addListing.reviewPrice'),       value: form.price ? `₼${form.price}` : '—' },
                { label: t('addListing.reviewPayment'),     value: PAYMENT_OPTS.find(o => o.value === form.paymentType)?.label || t('addListing.cash') },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start py-3">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium text-navy text-right max-w-xs">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 border border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              {t('addListing.back')}
            </button>
          : <div />
        }
        {step < STEPS.length - 1
          ? <button
              type="button"
              onClick={() => {
                if (step === 0 && !canProceed()) return
                const errs = step === 0 ? {} : getStepErrors()
                if (Object.keys(errs).length > 0) { setStepErrors(errs); return }
                setStepErrors({})
                setStep(s => s + 1)
              }}
              className={`px-8 py-3 font-bold rounded-xl transition-colors flex items-center gap-2 ${
                canProceed() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}>
              {t('addListing.next')} <ChevronRight size={18} />
            </button>
          : <button onClick={handleSubmit} disabled={submitting || !user}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2">
              {submitting ? t('addListing.publishing') : <><Check size={18} /> {t('addListing.publish')}</>}
            </button>
        }
      </div>

      {feedbackStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#0A2342] mb-2">Elanınız göndərildi! 🎉</h3>
            <p className="text-sm text-gray-500 mb-4">Admin təsdiqindən sonra saytda görünəcək. Bizimlə fikrinizi bölüşün:</p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFeedbackData(f => ({ ...f, type: 'suggestion' }))}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${feedbackData.type === 'suggestion' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600'}`}
              >
                💡 Təklif
              </button>
              <button
                onClick={() => setFeedbackData(f => ({ ...f, type: 'problem' }))}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${feedbackData.type === 'problem' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600'}`}
              >
                ⚠️ Problem
              </button>
            </div>

            <textarea
              value={feedbackData.message}
              onChange={e => setFeedbackData(f => ({ ...f, message: e.target.value }))}
              placeholder="Fikirlerinizi yazın... (isteğe bağlı)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleFeedbackSkip()}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
              >
                Keç
              </button>
              <button
                onClick={() => handleFeedbackSubmit()}
                disabled={!feedbackData.message.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Göndər
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

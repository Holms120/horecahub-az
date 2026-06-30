import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft, Check, Upload, X, AlertCircle, ImageOff,
  CheckCircle2, Loader2,
  ChefHat, Coffee, Thermometer, UtensilsCrossed,
  LayoutGrid, Wine, Users, Truck, ShoppingBasket,
  Shirt, Wrench, Printer, HardHat, Scale, GlassWater
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CITIES } from '../data/mockData'
import { useCategories } from '../hooks/useCategories'
import { useTranslation } from 'react-i18next'

const ICON_MAP = { ChefHat, Coffee, Thermometer, UtensilsCrossed, LayoutGrid, Wine, Users, Truck, ShoppingBasket, Shirt, Wrench, Printer, HardHat, Scale, GlassWater }

const NO_CONDITION_categories = [
  'food_ingredients', 'hygiene', 'alcohol', 'soft_beverages', 'packaging', 'textile',
  'print_ads', 'legal_finance', 'consulting', 'software', 'training', 'staff',
  'maintenance', 'construction', 'suppliers', 'business_sale',
]

const MAX_FILES     = 5
const MAX_MB        = 5
const ALLOWED       = ['jpg', 'jpeg', 'png', 'webp']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const strip       = v => (v || '').replace(/<[^>]*>/g, '').trim()

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

const EMPTY_FORM = {
  category: '', subcategory: '', otherDescription: '', title: '', description: '', keywords: '',
  condition: 'Yeni', city: '', price: '', paymentTypes: ['cash'],
}

export default function EditListing() {
  const { t }                       = useTranslation()
  const { id }                      = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate                    = useNavigate()

  const PAYMENT_OPTS = [
    { value: 'cash',   label: t('addListing.cash') },
    { value: 'credit', label: t('addListing.credit') },
    { value: 'order',  label: t('addListing.order') },
  ]

  const { categories, subcategories } = useCategories()
  const [form, setForm]             = useState(EMPTY_FORM)
  const [existingImages, setExistingImages] = useState([])
  const [newFiles, setNewFiles]     = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [imageError, setImageError] = useState('')

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving]         = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saved, setSaved]           = useState(false)
  const [saveError, setSaveError]   = useState('')

  const totalImages = existingImages.length + newFiles.length

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const placeholder =
    (form.subcategory && SUBCATEGORY_PLACEHOLDERS[form.subcategory]) ||
    CATEGORY_PLACEHOLDERS[form.category] ||
    { title: 'Elanın başlığını yazın', desc: 'Avadanlığın vəziyyəti, xüsusiyyətləri, satış səbəbini yazın...' }

  useEffect(() => {
    if (NO_CONDITION_categories.includes(form.category)) {
      setForm(f => ({ ...f, condition: 'Yeni' }))
    }
  }, [form.category])

  // Fetch listing and verify ownership
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { state: { from: `/listings/${id}/edit` } }); return }

    async function load() {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) { navigate('/listings'); return }
      if (data.user_id !== user.id) { navigate(`/listings/${id}`); return }

      setForm({
        category:    data.category    || '',
        subcategory:      data.subcategory      || '',
        otherDescription: data.other_description || '',
        title:       data.title       || '',
        description: data.description || '',
        keywords:    data.keywords    || '',
        condition:   data.condition === 'new' ? 'Yeni' : 'İşlənmiş',
        city:        data.city        || '',
        price:       data.price != null ? String(data.price) : '',
        paymentTypes: Array.isArray(data.payment_type) ? data.payment_type : (data.payment_type ? [data.payment_type] : ['cash']),
      })
      setExistingImages(Array.isArray(data.images) ? data.images : [])
      setPageLoading(false)
    }
    load()
  }, [user, authLoading, id, navigate])

  function removeExisting(url) {
    setExistingImages(imgs => imgs.filter(u => u !== url))
  }

  function handleFileChange(e) {
    const slots    = MAX_FILES - totalImages
    if (slots <= 0) return
    const incoming = Array.from(e.target.files)
    let firstError = ''
    const valid    = []

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

    const combined = [...newFiles, ...valid]
    newPreviews.forEach(u => URL.revokeObjectURL(u))
    setNewFiles(combined)
    setNewPreviews(combined.map(f => URL.createObjectURL(f)))
    e.target.value = ''
  }

  function removeNew(i) {
    URL.revokeObjectURL(newPreviews[i])
    setNewFiles(f => f.filter((_, idx) => idx !== i))
    setNewPreviews(p => p.filter((_, idx) => idx !== i))
    if (imageError) setImageError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    const fe = {}
    if (!form.category)                                                       fe.category       = t('addListing.selectCategory')
    if (subcategories[form.category]?.length > 0 && !form.subcategory)       fe.subcategory    = t('addListing.subcategory').replace(' *','')
    if (strip(form.title).length < 5)                                         fe.title          = t('addListing.errTitle')
    if (!form.city)                                                            fe.city           = t('addListing.errCity')
    if (Number(form.price) < 1)                                               fe.price          = form.category === 'staff' ? t('addListing.errSalary') : t('addListing.errPrice')
    setFieldErrors(fe)
    if (Object.keys(fe).length > 0) {
      setSaveError(Object.values(fe)[0])
      return
    }

    setSaving(true)
    setSaveError('')
    setFieldErrors({})

    // Upload new files
    const newUrls = []
    for (const file of newFiles) {
      const ext      = file.name.split('.').pop().toLowerCase()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('listings')
        .upload(fileName, file, { contentType: file.type })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('listings').getPublicUrl(fileName)
        newUrls.push(urlData.publicUrl)
      }
    }

    const { error } = await supabase
      .from('listings')
      .update({
        title:        strip(form.title),
        description:  strip(form.description),
        keywords:     form.keywords.trim() || null,
        category:          form.category,
        subcategory:       form.subcategory || null,
        other_description: form.subcategory?.endsWith('_other') && form.otherDescription ? strip(form.otherDescription) : null,
        condition:    form.condition === 'Yeni' ? 'new' : 'used',
        city:         form.city,
        price:        Number(form.price),
        payment_type: form.paymentTypes,
        images:       [...existingImages, ...newUrls],
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setSaveError(error.message)
      setSaving(false)
    } else {
      setSaved(true)
      setTimeout(() => navigate(`/listings/${id}`), 1800)
    }
  }

  // ── Loading states ────────────────────────────────────────────
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (saved) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-3">Elan yeniləndi!</h2>
        <p className="text-gray-500">Elan səhifəsinə yönləndirilirsiniz...</p>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to={`/listings/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-8 transition-colors"
      >
        <ChevronLeft size={16} /> {t('listingDetail.back')}
      </Link>

      <h1 className="text-2xl font-bold text-navy mb-8">Elanı redaktə et</h1>

      {saveError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle size={16} className="flex-shrink-0" />
          {saveError}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Kateqoriya ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-navy mb-4">{t('filter.category')} *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map(cat => {
              const Icon = ICON_MAP[cat.icon]
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.id, subcategory: '' }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    form.category === cat.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-300 text-gray-600'
                  }`}
                >
                  {Icon && <Icon size={20} />}
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
                      subcategory: sub.id,
                      otherDescription: '',
                      ...(['staff', 'consulting', 'software', 'training'].includes(f.category)
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
              {form.subcategory?.endsWith('_other') && (
                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1.5">
                    {t('addListing.otherDesc')}
                  </label>
                  <input
                    type="text"
                    value={form.otherDescription}
                    onChange={e => set('otherDescription', e.target.value)}
                    placeholder={t('addListing.otherPlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Detallar ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-navy">{t('addListing.listingDetails')}</h2>

          {!['staff', 'consulting', 'software', 'training'].includes(form.category) && (
            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.titleLabel')}</label>
              <input
                type="text" value={form.title} maxLength={80}
                onChange={e => { set('title', e.target.value); setFieldErrors(fe => ({ ...fe, title: '' })) }}
                placeholder={placeholder.title}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.title ? 'border-red-400' : 'border-gray-200'}`}
              />
              <div className="flex justify-between mt-1">
                {fieldErrors.title ? <p className="text-red-500 text-xs">{fieldErrors.title}</p> : <span />}
                <p className="text-xs text-gray-400">{form.title.length}/80</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.description')}</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder={placeholder.desc}
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Açar sözlər (keywords)</label>
            <input
              type="text"
              value={form.keywords}
              onChange={e => set('keywords', e.target.value)}
              placeholder="məs: püre, pure, sos, sauce — vergüllə ayırın"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {!NO_CONDITION_categories.includes(form.category) && (
          <div>
            <label className="block text-sm font-medium text-navy mb-2">{t('addListing.condition')}</label>
            <div className="flex gap-3">
              {['Yeni', 'İşlənmiş'].map(c => (
                <label
                  key={c}
                  className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${
                    form.condition === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                  }`}
                >
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
            <select
              value={form.city} onChange={e => { set('city', e.target.value); setFieldErrors(fe => ({ ...fe, city: '' })) }}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white ${fieldErrors.city ? 'border-red-400' : 'border-gray-200'}`}
            >
              <option value="">{t('addListing.selectCity')}</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
        </div>

        {/* ── Şəkillər ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-navy">{t('addListing.photosTitle')}</h2>
            <span className="text-sm text-gray-500 font-medium">{totalImages}/{MAX_FILES}</span>
          </div>

          {imageError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
              <AlertCircle size={14} className="flex-shrink-0" />
              {imageError}
            </div>
          )}

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Mövcud şəkillər</p>
              <div className="grid grid-cols-4 gap-2">
                {existingImages.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && existingImages.length > 0 && (
                      <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        {t('addListing.mainPhoto')}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExisting(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                    >
                      <X size={11} className="text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file previews */}
          {newPreviews.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Yeni şəkillər</p>
              <div className="grid grid-cols-4 gap-2">
                {newPreviews.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-blue-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNew(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                    >
                      <X size={11} className="text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload area */}
          {totalImages < MAX_FILES ? (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload size={24} className="text-gray-400 mb-1.5" />
              <span className="text-sm font-medium text-gray-600">{t('addListing.selectPhotos')}</span>
              <span className="text-xs text-gray-400 mt-0.5">
                {t('addListing.morePhotos', { count: MAX_FILES - totalImages })}
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
              <Check size={14} className="text-green-600" />
              Maksimum şəkil sayına çatılıb ({MAX_FILES}/{MAX_FILES})
            </div>
          )}

          {totalImages === 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700 mt-3">
              <ImageOff size={14} />
              {t('addListing.noPhotoWarning')}
            </div>
          )}
        </div>

        {/* ── Qiymət ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-navy">{t('addListing.reviewPrice')}</h2>

          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">{t('addListing.priceLabel')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₼</span>
              <input
                type="number"
                min="1"
                value={form.price}
                onChange={e => { set('price', e.target.value); setFieldErrors(fe => ({ ...fe, price: '' })) }}
                placeholder="0"
                className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${fieldErrors.price ? 'border-red-400' : 'border-gray-200'}`}
              />
            </div>
            {fieldErrors.price && <p className="text-red-500 text-xs mt-1">{fieldErrors.price}</p>}
            {!fieldErrors.price && form.price !== '' && Number(form.price) < 1 && (
              <p className="text-xs text-red-600 mt-1">Qiymət ən azı ₼1 olmalıdır</p>
            )}
          </div>

          {!NO_CONDITION_categories.includes(form.category) && (
            <div>
              <label className="block text-sm font-medium text-navy mb-3">{t('addListing.paymentType')}</label>
              <div className="flex flex-col gap-2">
                {PAYMENT_OPTS.map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      form.paymentTypes.includes(value)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.paymentTypes.includes(value)}
                      onChange={() => set('paymentTypes', form.paymentTypes.includes(value) ? form.paymentTypes.filter(p => p !== value) : [...form.paymentTypes, value])}
                      className="accent-blue-600 rounded"
                    />
                    <span className={`text-sm font-medium ${form.paymentTypes.includes(value) ? 'text-blue-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 justify-end">
          <Link
            to={`/listings/${id}`}
            className="px-6 py-3 border border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            {t('editProfile.cancel')}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm flex items-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? t('editProfile.saving') : t('editProfile.save')}
          </button>
        </div>

      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { CITIES } from '../data/mockData'
import { useCategories } from '../hooks/useCategories'
import { supabase } from '../supabaseClient'
import { useTranslation } from 'react-i18next'

function Section({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full text-sm font-semibold text-navy mb-3"
      >
        {title}
        {open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
      </button>
      {open && children}
    </div>
  )
}

export default function FilterSidebar({ filters, onChange, onClear }) {
  const { t } = useTranslation()
  const { categories, subcategories } = useCategories()
  const [categoryCounts, setCategoryCounts] = useState({})

  const PAYMENT_OPTS = [
    { value: 'cash',   label: t('filter.cash') },
    { value: 'credit', label: t('filter.credit') },
    { value: 'order',  label: t('filter.order') },
  ]

  useEffect(() => {
    supabase
      .from('listings')
      .select('category')
      .eq('status', 'active')
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        data.forEach(row => {
          if (row.category) counts[row.category] = (counts[row.category] || 0) + 1
        })
        setCategoryCounts(counts)
      })
  }, [])
  const hasFilters = filters.category || filters.priceMin || filters.priceMax ||
    filters.conditions.length > 0 || filters.city || filters.verifiedOnly ||
    (filters.paymentTypes?.length > 0) || (filters.subcategories?.length > 0)

  function toggleSubcategory(val) {
    const curr = filters.subcategories || []
    const next = curr.includes(val) ? curr.filter(s => s !== val) : [...curr, val]
    onChange({ ...filters, subcategories: next })
  }

  function toggleCondition(val) {
    const next = filters.conditions.includes(val)
      ? filters.conditions.filter(c => c !== val)
      : [...filters.conditions, val]
    onChange({ ...filters, conditions: next })
  }

  function togglePaymentType(val) {
    const curr = filters.paymentTypes || []
    const next = curr.includes(val)
      ? curr.filter(t => t !== val)
      : [...curr, val]
    onChange({ ...filters, paymentTypes: next })
  }

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy text-sm">{t('filter.title')}</h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X size={12} /> {t('filter.clear')}
          </button>
        )}
      </div>

      {!['staff', 'consulting', 'software', 'training', 'business_sale'].includes(filters.category) && (
        <Section title={t('filter.category')}>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value=""
                checked={filters.category === ''}
                onChange={() => onChange({ ...filters, category: '', subcategories: [] })}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700">{t('filter.all')}</span>
            </label>
            {categories.filter(c => !['staff', 'suppliers'].includes(c.id)).map(cat => (
              <label key={cat.id} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={filters.category === cat.id}
                    onChange={() => onChange({ ...filters, category: cat.id, subcategories: [] })}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-navy">{t(cat.key) || cat.label}</span>
                </div>
                {categoryCounts[cat.id] > 0 && (
                  <span className="text-xs text-gray-400">{categoryCounts[cat.id]}</span>
                )}
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* Subcategory filter — shown when a category with subcategories is selected */}
      {filters.category && subcategories[filters.category]?.length > 0 && (
        <Section title={t('filter.subcategory')}>
          <div className="space-y-1.5">
            {subcategories[filters.category].map(sub => (
              <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filters.subcategories || []).includes(sub.id)}
                  onChange={() => toggleSubcategory(sub.id)}
                  className="accent-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{t('subcat.' + sub.id) || sub.label}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {!['staff', 'consulting', 'software', 'training', 'business_sale'].includes(filters.category) && (
        <>
          <Section title={t('filter.priceRange')}>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={t('filter.min')}
                value={filters.priceMin}
                onChange={e => onChange({ ...filters, priceMin: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="number"
                placeholder={t('filter.max')}
                value={filters.priceMax}
                onChange={e => onChange({ ...filters, priceMax: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </Section>

          <Section title={t('filter.condition')}>
            <div className="space-y-2">
              {['Yeni', 'İşlənmiş'].map(cond => (
                <label key={cond} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.conditions.includes(cond)}
                    onChange={() => toggleCondition(cond)}
                    className="accent-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{cond === 'Yeni' ? t('filter.new') : t('filter.used')}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section title={t('filter.paymentType')}>
            <div className="space-y-2">
              {PAYMENT_OPTS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(filters.paymentTypes || []).includes(value)}
                    onChange={() => togglePaymentType(value)}
                    className="accent-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </Section>
        </>
      )}

      <Section title={t('filter.city')}>
        <select
          value={filters.city}
          onChange={e => onChange({ ...filters, city: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">{t('filter.allCities')}</option>
          {CITIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Section>

      <Section title={t('filter.seller')}>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
              filters.verifiedOnly ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              filters.verifiedOnly ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </div>
          <span className="text-sm text-gray-700">{t('filter.verifiedOnly')}</span>
        </label>
      </Section>
    </aside>
  )
}

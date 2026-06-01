import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { CATEGORIES, CITIES } from '../data/mockData'

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
  const hasFilters = filters.category || filters.priceMin || filters.priceMax ||
    filters.conditions.length > 0 || filters.city || filters.verifiedOnly

  function toggleCondition(val) {
    const next = filters.conditions.includes(val)
      ? filters.conditions.filter(c => c !== val)
      : [...filters.conditions, val]
    onChange({ ...filters, conditions: next })
  }

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy text-sm">Filtrlər</h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X size={12} /> Təmizlə
          </button>
        )}
      </div>

      <Section title="Kateqoriya">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={filters.category === ''}
              onChange={() => onChange({ ...filters, category: '' })}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">Hamısı</span>
          </label>
          {CATEGORIES.map(cat => (
            <label key={cat.id} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={filters.category === cat.id}
                  onChange={() => onChange({ ...filters, category: cat.id })}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700 group-hover:text-navy">{cat.label}</span>
              </div>
              <span className="text-xs text-gray-400">{cat.count}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Qiymət aralığı (₼)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={e => onChange({ ...filters, priceMin: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={e => onChange({ ...filters, priceMax: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </Section>

      <Section title="Vəziyyət">
        <div className="space-y-2">
          {['Yeni', 'İşlənmiş'].map(cond => (
            <label key={cond} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.conditions.includes(cond)}
                onChange={() => toggleCondition(cond)}
                className="accent-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">{cond}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Şəhər">
        <select
          value={filters.city}
          onChange={e => onChange({ ...filters, city: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">Bütün şəhərlər</option>
          {CITIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Section>

      <Section title="Satıcı">
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
          <span className="text-sm text-gray-700">Yalnız doğrulanmış satıcılar</span>
        </label>
      </Section>
    </aside>
  )
}

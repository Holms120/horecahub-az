import { useMemo } from 'react'

const OPERATORS = ['050', '051', '055', '060', '070', '077', '099', '010']

function parsePhone(v) {
  if (!v || !v.startsWith('+994')) return { op: '050', num: '' }
  const rest = v.slice(4)
  const op   = OPERATORS.find(o => rest.startsWith(o)) || '050'
  const num  = rest.slice(op.length)
  return { op, num }
}

export default function PhoneInput({ value = '', onChange, required = false, placeholder = '1234567' }) {
  const { op, num } = useMemo(() => parsePhone(value), [value])

  function update(newOp, rawNum) {
    const digits = rawNum.replace(/\D/g, '').slice(0, 7)
    onChange(`+994${newOp}${digits}`)
  }

  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
      <span className="flex items-center px-3 bg-gray-50 text-gray-500 text-sm font-medium border-r border-gray-200 select-none flex-shrink-0">
        +994
      </span>
      <select
        value={op}
        onChange={e => update(e.target.value, num)}
        className="px-2 py-3 bg-gray-50 text-sm text-gray-700 focus:outline-none border-r border-gray-200 flex-shrink-0"
      >
        {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input
        type="tel"
        value={num}
        onChange={e => update(op, e.target.value)}
        maxLength={7}
        placeholder={placeholder}
        required={required}
        className="flex-1 px-3 py-3 bg-white text-sm focus:outline-none min-w-0"
      />
    </div>
  )
}

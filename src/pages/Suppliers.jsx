import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { MapPin, Package } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Suppliers() {
  const { t } = useTranslation()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, city, logo_url, description, supplier_categories, created_at')
        .eq('account_type', 'supplier')
        .eq('is_blocked', false)
        .order('created_at', { ascending: false })
      setSuppliers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Təchizatçılar — HorecaHub.az</title>
        <meta name="description" content="Azərbaycanın HoReCa sektoru üçün təchizatçılar" />
      </Helmet>

      <section className="bg-gradient-to-br from-navy to-blue-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Təchizatçılar</h1>
          <p className="text-blue-200 text-sm">HoReCa sektoru üçün təchizatçı şirkətlər</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">Hələ təchizatçı yoxdur</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <Link
                key={s.id}
                to={`/profile/${s.id}`}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl overflow-hidden flex-shrink-0 border border-gray-200">
                    {s.logo_url
                      ? <img src={s.logo_url} alt={s.company_name} className="w-full h-full object-cover" />
                      : (s.company_name || s.full_name || 'T').charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm leading-tight">{s.company_name || s.full_name}</p>
                    {s.city && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {s.city}
                      </p>
                    )}
                  </div>
                </div>
                {s.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{s.description}</p>
                )}
                {s.supplier_categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.supplier_categories.slice(0, 3).map(cat => (
                      <span key={cat} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState({})
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    const [{ data: cats }, { data: subs }] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('subcategories').select('*').eq('is_active', true).order('sort_order'),
    ])

    setCategories(cats || [])

    const subMap = {}
    for (const sub of (subs || [])) {
      if (!subMap[sub.category_id]) subMap[sub.category_id] = []
      subMap[sub.category_id].push(sub)
    }
    setSubcategories(subMap)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  return { categories, subcategories, loading, refetch: fetchAll }
}

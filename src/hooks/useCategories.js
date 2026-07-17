import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

// Categories change rarely; cache them at module level so a grid of
// ListingCards shares one fetch instead of issuing one per component.
let cache = null
let inflight = null
const listeners = new Set()

function fetchAll() {
  if (!inflight) {
    inflight = (async () => {
      const [{ data: cats }, { data: subs }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('subcategories').select('*').eq('is_active', true).order('sort_order'),
      ])

      const subMap = {}
      const subById = {}
      const catById = {}
      for (const cat of (cats || [])) catById[cat.id] = cat
      for (const sub of (subs || [])) {
        if (!subMap[sub.category_id]) subMap[sub.category_id] = []
        subMap[sub.category_id].push(sub)
        subById[sub.id] = sub
      }

      cache = { categories: cats || [], subcategories: subMap, catById, subById }
      inflight = null
      for (const notify of listeners) notify(cache)
      return cache
    })()
  }
  return inflight
}

export function useCategories() {
  const [state, setState] = useState(cache)

  useEffect(() => {
    listeners.add(setState)
    if (cache) setState(cache)
    else fetchAll()
    return () => { listeners.delete(setState) }
  }, [])

  return {
    categories: state?.categories || [],
    subcategories: state?.subcategories || {},
    catById: state?.catById || {},
    subById: state?.subById || {},
    loading: !state,
    refetch: () => { cache = null; return fetchAll() },
  }
}

import i18n from '../i18n'

// Display label for a category/subcategory row. Labels edited in the admin
// panel (DB) win; the texts bundled in the i18n JSON files are only a
// fallback — so what the admin saves is what the catalog shows.
//
// Precedence per UI language:
//   az:    row.label → bundled az translation
//   ru/en: row.label_ru / row.label_en → bundled ru/en translation → row.label
//
// `row` may be undefined (e.g. cache still loading) — pass `id` so the
// bundled translation can still be used. Returns '' when nothing is known;
// callers decide whether to hide the element or show something else.
export function catalogLabel(row, prefix, id) {
  const slug = row?.id ?? id
  if (!slug) return ''
  const lang = (i18n.language || 'az').split('-')[0]
  const key = `${prefix}.${slug}`

  if (lang !== 'az') {
    const perLang = lang === 'ru' ? row?.label_ru : row?.label_en
    if (perLang) return perLang
    const bundled = i18n.getResource(lang, 'translation', key)
    if (bundled) return bundled
  }
  return row?.label || i18n.getResource('az', 'translation', key) || ''
}

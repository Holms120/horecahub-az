// PostgREST .or() filter strings treat `,` `(` `)` as syntax and `%` `_` `\`
// as LIKE wildcards — raw user input there can break or distort the query.
export function sanitizeSearch(input) {
  return String(input ?? '')
    .replace(/[,()%_\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}

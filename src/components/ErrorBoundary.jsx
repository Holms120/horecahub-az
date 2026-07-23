import { Component } from 'react'
import * as Sentry from '@sentry/react'

// A dynamic-import / lazy-chunk failure after a redeploy: the browser is
// holding a stale index.html that points at a chunk hash the new build no
// longer serves. Re-loading the page pulls the fresh index + chunks.
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk \d+ failed|ChunkLoadError|is not a valid JavaScript MIME type/i

function isChunkError(error) {
  const msg = (error && (error.message || error.name)) || String(error || '')
  return CHUNK_ERROR_RE.test(msg)
}

// Without an error boundary, any throw during render (or a failed lazy-chunk
// fetch surfaced through <Suspense>) unmounts the whole React tree and leaves
// a blank white page. This catches it: stale-chunk failures self-heal with a
// single reload; anything else shows a recoverable error UI and is reported.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, chunk: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, chunk: isChunkError(error) }
  }

  componentDidCatch(error, info) {
    if (isChunkError(error)) {
      // Reload at most once per ~10s window so a genuinely broken build can't
      // trap the user in a reload loop.
      const KEY = 'hh_chunk_reload_at'
      let last = 0
      try { last = Number(sessionStorage.getItem(KEY)) || 0 } catch { /* private mode */ }
      if (Date.now() - last > 10000) {
        try { sessionStorage.setItem(KEY, String(Date.now())) } catch { /* ignore */ }
        window.location.reload()
        return
      }
    }
    Sentry.captureException(error, { extra: { componentStack: info?.componentStack } })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    // A chunk error normally reloads in componentDidCatch; this only shows if
    // the reload guard tripped (repeated failure).
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-bold text-navy mb-2">
            {this.state.chunk ? 'Yenilənmə tələb olunur' : 'Nəsə səhv getdi'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {this.state.chunk
              ? 'Sayt yeniləndi. Səhifəni yeniləyin.'
              : 'Bu bölmə yüklənərkən xəta baş verdi. Səhifəni yeniləyin.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            Yenilə
          </button>
        </div>
      </div>
    )
  }
}

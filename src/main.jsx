import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://6e3acc7df24799973cb7aa9be2ec2844@o4511651001335808.ingest.de.sentry.io/4511651014967376",
});

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './i18n/index.js'
import App from './App.jsx'

// Last-resort guard: anything that throws before/while React mounts leaves an
// empty #root and a blank page that <ErrorBoundary> can never catch, because
// React is not running yet. Show something the user can act on, and report it.
try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </StrictMode>,
  )
} catch (e) {
  Sentry.captureException(e)
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML =
      '<div style="padding:2rem;font:16px system-ui;text-align:center">' +
      '<p>Sayt yüklənmədi. Səhifəni yeniləyin.</p>' +
      '<button onclick="location.reload()" style="margin-top:1rem;padding:.6rem 1.2rem;' +
      'border:0;border-radius:.75rem;background:#2563eb;color:#fff;font-weight:600">Yenilə</button>' +
      '</div>'
  }
}

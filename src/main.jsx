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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)

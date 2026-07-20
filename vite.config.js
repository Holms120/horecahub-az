import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  build: {
    // Explicit floor instead of Vite's default 'modules'. esbuild only lowers
    // SYNTAX — it never polyfills built-in methods — so anything newer than
    // this baseline must be avoided in source (see lastOf() in Admin.jsx,
    // which replaced Array.prototype.at(): that one needs iOS 15.4+).
    target: ['es2020', 'safari14', 'chrome87', 'firefox78', 'edge88'],
    rollupOptions: {
      output: {
        // Everything used to land in one ~837 kB entry chunk, so every deploy
        // invalidated the whole bundle for returning visitors. Splitting the
        // big, rarely-changing vendors lets them stay cached across releases.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-'))
            return 'vendor-charts'
          if (id.includes('@sentry')) return 'vendor-sentry'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('i18next')) return 'vendor-i18n'
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler'))
            return 'vendor-react'
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})

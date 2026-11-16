import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // The deployed api-gateway (use http://localhost:8080 instead when working through the SSH tunnel). Origin is
      // dropped so the gateway sees a same-origin request and its CORS allow-list (the production frontend origin)
      // does not apply.
      '/api': {
        target: 'https://api.tgdplanet.cloud',
        changeOrigin: true,
        configure: (proxy) => proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin')),
      },
    },
  },
})

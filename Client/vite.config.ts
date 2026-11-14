import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5163',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('/pages/director/')) {
            return 'director-views';
          }
          if (id.includes('/pages/teamLead/')) {
            return 'teamlead-views';
          }
          if (id.includes('/pages/admin/')) {
            return 'admin-views';
          }
          if (id.includes('/pages/supportAgent/')) {
            return 'agent-views';
          }
        },
      },
    },
  },
})

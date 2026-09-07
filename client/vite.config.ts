import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow the sandbox preview host so the dev server is reachable
    // from the browser proxy. Dev-only; does not affect the build.
    allowedHosts: true,
  },
})

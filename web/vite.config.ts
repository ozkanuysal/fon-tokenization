import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // deployments/*.json lives one level above the app
  server: { fs: { allow: ['..'] } },
})

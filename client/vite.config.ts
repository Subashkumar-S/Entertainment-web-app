import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Load env (VITE_* vars) from the repo-root .env — the single source of truth.
  envDir: '..',
})

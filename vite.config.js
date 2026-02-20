import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Environment variables prefixed with VITE_ are exposed to the client
  // Set these in Vercel environment variables:
  //   VITE_SUPABASE_URL
  //   VITE_SUPABASE_ANON_KEY
})

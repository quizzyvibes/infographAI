import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Vercel injects variables into process.env, but loadEnv might prioritize .env files.
  // We check both the loaded env object and the actual process.env to find the key.
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the Gemini SDK so it works in the browser
      // We default to '' to prevent 'undefined' string injection if missing
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})

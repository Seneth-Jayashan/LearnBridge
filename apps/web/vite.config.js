import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- Import this

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- Add this to the plugins array
  ],

  test: {
    globals: true, 
    environment: 'jsdom', 
    setupFiles: './src/setupTests.js', 
    css: true, 
  }
})
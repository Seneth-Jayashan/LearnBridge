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
    globals: true, // This allows you to use describe, it, expect without importing them
    environment: 'jsdom', // Simulates a browser environment for React components
    setupFiles: './src/setupTests.js', // Points to the file you just created
    css: true, // Optional: parses CSS if your tests rely on it
  }
})
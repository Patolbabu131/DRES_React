import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    qrcode() // Adds QR code generation
  ],
  server: {
    host: '0.0.0.0',
    port: 7780,  // Using the port that's currently working
    strictPort: false,
    open: true
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "tailwindcss";


export default defineConfig({
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5193",
      "/r": {
        target: "http://127.0.0.1:5193",
        ws: true,
      },
    },
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
})
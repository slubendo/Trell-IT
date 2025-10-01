import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "tailwindcss";


export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:5193",
      "/r": {
        target: "http://localhost:5193",
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
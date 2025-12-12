import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "tailwindcss";


export default defineConfig({
  server: {
    proxy: {
      "/api": "https://trell-it-withered-fire-570.fly.dev/",
      "/r": {
        target: "https://trell-it-withered-fire-570.fly.dev/",
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
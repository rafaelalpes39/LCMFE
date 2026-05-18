import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt'
    
  ],

  css: [
    '@/assets/css/main.css'
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'
    }
  },

  vite: {
    plugins: [tailwindcss()],
  },

  vuetify: {
    moduleOptions: {},
    vuetifyOptions: {}
  }
})
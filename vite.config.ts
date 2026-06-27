import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (
            id.includes('node_modules/sonic-weave/dist/scale-workshop-2-parser') ||
            id.includes('node_modules/sonic-weave/scale-workshop-2-parser')
          ) {
            return 'scale-workshop-legacy'
          }

          if (
            id.includes('node_modules/sonic-weave/dist/parser/chord-parser') ||
            id.includes('node_modules/sonic-weave/dist/parser/sonic-weave-chord')
          ) {
            return 'sonic-weave-chord-parser'
          }

          if (id.includes('node_modules/xen-dev-utils')) {
            return 'xen-dev-utils'
          }

          if (id.includes('node_modules/moment-of-symmetry')) {
            return 'moment-of-symmetry'
          }

          if (id.includes('node_modules/sonic-weave')) {
            return 'sonic-weave'
          }

          if (id.includes('node_modules/sw-synth')) {
            return 'sw-synth'
          }

          if (id.includes('node_modules/webmidi') || id.includes('node_modules/xen-midi')) {
            return 'midi'
          }

          if (id.includes('node_modules/vue') || id.includes('node_modules/pinia')) {
            return 'vue-vendor'
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

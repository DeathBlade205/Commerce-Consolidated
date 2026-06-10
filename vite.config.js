import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Static hosts without an SPA fallback (GitHub Pages et al.) 404 when a deep
// link like /process is refreshed. Shipping the app itself as 404.html makes
// those hosts boot the app anyway, and the router then resolves the path.
function spaFallback() {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync(resolve('dist/index.html'), resolve('dist/404.html'))
    },
  }
}

export default defineConfig({
  plugins: [vue(), spaFallback()],
})

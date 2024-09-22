/// <reference types="vitest" />
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  // Define `base` because this deploys to user.github.io/repo-name/
  base: './',
  build: {
    // Do not inline images and assets to avoid the phaser error
    // "Local data URIs are not supported"
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor: resolve(__dirname, 'src/editor/editor.html'),
      },
    },
  },
  publicDir: 'data',
  resolve: {
    alias: {
      src: resolve(__dirname, 'src'),
    },
  },
  server: {
    // vite server configs, for details see [vite doc](https://vitejs.dev/config/#server-host)
    port: 3000,
    proxy: {
      '/api/v1': 'http://localhost:3001/',
      '/ws': {
        target: 'ws://localhost:3001/',
        ws: true,
        // rewrite: (path) => path.replace(/^\/ws/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    deps: {
      optimizer: {
        web: {
          include: ['vitest-canvas-mock'],
        },
      },
    },
  },
})

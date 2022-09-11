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
      }
    }
  },
  resolve: {
    alias: {
      src: resolve(__dirname, 'src'),
    },
  }
});
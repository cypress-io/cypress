import { defineConfig } from 'vite'
const cssFolders = require('./css.folders')

export default defineConfig({
  resolve: {
    alias: [
      'core',
      'css',
      'components',
      'hooks',
      'shared',
      'stories',
      'util',
    ].map((p) => {
      return { find: new RegExp(`^${p}/`), replacement: `/src/${p}/` }
    }),
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: cssFolders,
      },
    },
  },
  root: __dirname,
})

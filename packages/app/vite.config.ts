import { makeConfig } from '../frontend-shared/vite.config'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'

export default makeConfig({
  optimizeDeps: {
    include: [
      '@urql/core',
      'vue-i18n',
      '@cypress/vue',
      'p-defer',
      '@vue/test-utils',
      'vue-router',
      '@urql/devtools',
      '@urql/exchange-graphcache',
    ],
  },
}, {
  plugins: [
    Layouts(),
    Pages({ extensions: ['vue'] }),
  ],
})

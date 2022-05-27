import { makeConfig } from '../frontend-shared/vite.config'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'
import Copy from 'rollup-plugin-copy'
import { resolve } from 'path'

export default makeConfig({
  optimizeDeps: {
    include: [
      '@urql/core',
      'vue-i18n',
      'p-defer',
      '@vue/test-utils',
      'vue-router',
      '@urql/devtools',
      '@urql/exchange-graphcache',
      'dayjs',
      'dayjs/plugin/relativeTime',
      'dayjs/plugin/duration',
    ],
  },
}, {
  plugins: [
    Layouts(),
    Pages({ extensions: ['vue'] }),
    Copy({
      targets: [{
        src: resolve(__dirname, '../frontend-shared/src/assets/logos/favicon.png'),
        dest: 'dist',
      }],
    }),
  ],
})

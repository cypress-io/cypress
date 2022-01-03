import { makeConfig } from '../frontend-shared/vite.config'
import { ViteFaviconsPlugin } from 'vite-plugin-favicon'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'

export default makeConfig({
  optimizeDeps: {
    include: [
      '@urql/core',
      'vue-i18n',
      '@cypress/vue',
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
    ViteFaviconsPlugin({
      logo: require.resolve('@packages/frontend-shared/src/assets/logos/favicon.png'),
      // avoid building favicons for all formats at startup by explicitly saying no to most
      // It takes a good 20 sec to make if we dont and we don't use it anyway
      favicons: {
        icons: {
          android: false, // Create Android homescreen icon. `boolean` or `{ offset, background }` or an array of sources
          appleIcon: false, // Create Apple touch icons. `boolean` or `{ offset, background }` or an array of sources
          appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background }` or an array of sources
          favicons: true, // Create regular favicons. `boolean` or `{ offset, background }` or an array of sources
          windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background }` or an array of sources
          yandex: false, // Create Yandex browser icon. `boolean` or `{ offset, background }` or an array of sources
        },
      },
    }),
  ],
})

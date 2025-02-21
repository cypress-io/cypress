import { makeConfig } from '@packages/frontend-shared/vite.config.mjs'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'
import Copy from 'rollup-plugin-copy'
import Legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'
import { federation } from '@module-federation/vite'

const config = makeConfig({
  optimizeDeps: {
    include: [
      'javascript-time-ago',
      'ansi-to-html',
      'fuzzysort',
      '@cypress-design/**',
      '@cypress-design/vue-button',
      'debug',
      'p-defer',
      'bluebird',
      'events',
      '@popperjs/core',
      '@opentelemetry/*',
    ],
    esbuildOptions: {
      target: 'ES2022',
    },
  },
  build: {
    target: 'ES2022',
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
    Legacy({
      targets: ['last 3 major versions'],
      modernPolyfills: true,
      renderLegacyChunks: false,
    }),
  ],
})

// With some trial and error, it appears that the module federation plugin needs to be added 
// to the plugins array first so that the dynamic modules are available properly with respect 
// to the other plugins.
config.plugins.unshift(
  ...federation({
    name: 'host',
    remotes: {
      'app-studio': {
        type: 'module',
        name: 'app-studio',
        entryGlobalName: 'app-studio',
        entry: '/__cypress-studio/app-studio.js',
        shareScope: 'default',
      },
    },
    filename: 'assets/app-studio.js',
  }),
)

export default config

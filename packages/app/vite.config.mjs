import { makeConfig } from '@packages/frontend-shared/vite.config.mjs'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'
import Copy from 'rollup-plugin-copy'
import Legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'

const config = makeConfig({
  optimizeDeps: {
    include: [
      'ansi-to-html',
      'react',
      'react-dom',
      'react-dom/client',
      'fuzzysort',
      '@cypress-design/**',
      '@cypress-design/vue-button',
      'debug',
      'bluebird',
      'events',
      '@popperjs/core',
      '@opentelemetry/*',
      '@headlessui/vue',
      '@cypress-design/vue-icon',
      '@cypress-design/vue-statusicon',
      '@module-federation/runtime',
      'human-interval',
      'floating-vue',
      'dayjs',
      'dayjs/plugin/relativeTime',
      'dayjs/plugin/duration',
      'dayjs/plugin/customParseFormat',
      'dayjs/plugin/utc',
      'markdown-it',
      '@cypress-design/vue-tabs',
      'gravatar',
      '@opentelemetry/sdk-trace-web',
      '@opentelemetry/resources',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/api',
      '@opentelemetry/semantic-conventions',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/core',
      'semver/functions/major',
      '@vueuse/core',
      'javascript-time-ago',
    ],
    exclude: [
      '@toycode/markdown-it-class',
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
    // Without an explicit resolver, the plugin switches to React routes as
    // soon as any `vite:react*` plugin is present and stops serving
    // `virtual:generated-pages`.
    Pages({ extensions: ['vue'], resolver: 'vue' }),
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

// See src/runner/react-untyped.d.ts
config.resolve.alias = [
  ...config.resolve.alias,
  { find: '#host/react', replacement: 'react' },
  { find: '#host/react-dom', replacement: 'react-dom' },
]

export default config

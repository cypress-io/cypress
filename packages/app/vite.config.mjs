import { makeConfig } from '../frontend-shared/vite.config.mjs'
import Layouts from 'vite-plugin-vue-layouts'
import Pages from 'vite-plugin-pages'
import Copy from 'rollup-plugin-copy'
import Legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'

export default makeConfig({
  optimizeDeps: {
    entries: [
      'javascript-time-ago',
      'ansi-to-html',
      'fuzzysort',
      '@cypress-design/vue-button',
      'debug',
      'fuzzysort',
      '@cypress-design/vue-button',
      'p-defer',
      'bluebird',
      'events',
      '@popperjs/core', 
      '@opentelemetry/sdk-trace-web', 
      '@opentelemetry/resources', 
      '@opentelemetry/sdk-trace-base', 
      '@opentelemetry/api', 
      '@opentelemetry/semantic-conventions', 
      '@opentelemetry/exporter-trace-otlp-http'
    ]
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
      targets: ['Chrome >= 80', 'Firefox >= 86', 'Edge >= 80'],
      modernPolyfills: true,
      renderLegacyChunks: false,
    }),
  ],
})

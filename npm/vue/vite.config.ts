// This Vite config is only used for testing, not building!
// For building this package, check out rollup.config.ts

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
// The package declares only a `module` field, which Node resolution ignores
import { CypressEsm } from '@cypress/vite-plugin-cypress-esm/dist/index.js'

export default defineConfig({
  plugins: [
    vue(),
    // Specs pass raw message objects to createI18n, and the <i18n> block relies on the legacy API
    VueI18nPlugin({ runtimeOnly: false, compositionOnly: false }),
    // Lets specs stub ES module exports with cy.stub
    CypressEsm({
      // The plugin's rewrite corrupts bundled identifiers such as `renderToString$1`, and
      // `**` does not match the dot directory `.vite`, so the prebundled deps need their own entry
      ignoreModuleList: ['**/node_modules/**', '**/node_modules/.vite/**', '**/vue/dist/**'],
      // Proxying a component drops the setup context that <script setup> components destructure
      ignoreImportList: ['**/*.vue'],
    }),
  ],
  define: {
    // The i18n plugin precompiles messages to the AST format that only JIT compilation can run
    __INTLIFY_JIT_COMPILATION__: true,
  },
  resolve: {
    alias: {
      // Specs mount components with template strings, which need the runtime compiler
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
})

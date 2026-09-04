import { defineConfig } from 'cypress'
import type { Plugin } from 'vite'

import viteConfig from './vite.config.js'

const failureMode = process.env.VITE_NATIVE_IMPORT_FAILURE_MODE
const nativeSupportImportRequest = '[vite-import-recovery] native support import request'
let nativeSupportImportRequests = 0

if (failureMode !== 'once' && failureMode !== 'always') {
  throw new Error(`Unexpected VITE_NATIVE_IMPORT_FAILURE_MODE: ${failureMode}`)
}

const failNativeSupportImports: Plugin = {
  name: 'cypress-test-fail-native-support-imports',
  enforce: 'pre',
  configureServer (server) {
    server.middlewares.use((request, response, next) => {
      const isNativeSupportImport = request.headers['sec-fetch-dest'] === 'script'
        && request.url?.includes('/cypress/support/component.js')

      if (!isNativeSupportImport) {
        return next()
      }

      nativeSupportImportRequests += 1
      process.stdout.write(`${nativeSupportImportRequest} ${nativeSupportImportRequests}\n`)

      if (failureMode === 'once' && nativeSupportImportRequests > 1) {
        return next()
      }

      response.statusCode = 503
      response.setHeader('Content-Type', 'text/javascript')

      return response.end('Native support import intentionally unavailable')
    })
  },
}

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        ...viteConfig,
        plugins: [
          ...(viteConfig.plugins ?? []),
          failNativeSupportImports,
        ],
      },
    },
  },
})

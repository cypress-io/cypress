import { defineConfig } from 'cypress'

export default defineConfig({
  'viewportWidth': 500,
  'viewportHeight': 500,
  'responseTimeout': 2500,
  'projectId': '134ej7',
  'experimentalFetchPolyfill': true,
  'e2e': {
    'supportFile': false,
  },
  'component': {
    experimentalSingleTabRunMode: true,
    excludeSpecPattern: 'examples/**/*',
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    },
  },
})

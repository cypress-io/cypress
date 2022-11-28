const { defineConfig } = require('cypress')

module.exports = defineConfig({
  viewportWidth: 400,
  viewportHeight: 400,
  video: false,
  projectId: 'z9dxah',
  env: {
    reactDevtools: true,
  },
  experimentalFetchPolyfill: true,
  component: {
    experimentalSingleTabRunMode: true,
    excludeSpecPattern: [
      '**/__snapshots__/*',
      '**/__image_snapshots__/*',
      'examples/**/*',
    ],
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})

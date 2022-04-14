const { devServer } = require('@cypress/vite-dev-server')

module.exports = {
  viewportWidth: 1024,
  viewportHeight: 800,
  video: false,
  projectId: 'z9dxah',
  env: {
    reactDevtools: true,
  },
  fixturesFolder: false,
  component: {
    excludeSpecPattern: [
      '**/__snapshots__/*',
      '**/__image_snapshots__/*',
    ],
    devServer,
  },
}

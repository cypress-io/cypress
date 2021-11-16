module.exports = {
  viewportWidth: 1024,
  viewportHeight: 800,
  video: false,
  projectId: 'z9dxah',
  testFiles: '**/*spec.{js,jsx,ts,tsx}',
  env: {
    reactDevtools: true,
  },
  ignoreTestFiles: [
    '**/__snapshots__/*',
    '**/__image_snapshots__/*',
  ],
  componentFolder: 'src',
  fixturesFolder: false,
  component: {
    setupNodeEvents (on, config) {
      const { startDevServer } = require('@cypress/vite-dev-server')

      on('dev-server:start', (options) => startDevServer({ options }))

      return config
    },
  },
}

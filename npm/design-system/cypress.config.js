module.exports = {
  viewportWidth: 1024,
  viewportHeight: 800,
  video: false,
  projectId: 'z9dxah',
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
    testFiles: '**/*spec.{js,jsx,ts,tsx}',
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/vite-dev-server')

      return startDevServer({ options: cypressConfig })
    },
  },
}

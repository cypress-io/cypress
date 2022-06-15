module.exports = {
  viewportWidth: 400,
  viewportHeight: 400,
  video: false,
  experimentalFetchPolyfill: true,
  component: {
    excludeSpecPattern: [
      '**/__snapshots__/*',
      '**/__image_snapshots__/*',
      'examples/**/*',
      // due to how we handle system-tests, tests with hooks
      // error, since cypress/mount resolves a different `react`
      // than the actual spec file does.
      // it is **not** an issue in production, since the binary
      // does not have a node_modules with a `react` dependency in it.
      '**/*counter-use-hooks/**/*',
      '**/*rerender/**/*',
    ],
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'cypress/**/*.cy.jsx',
  },
}

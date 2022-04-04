import systemTests from '../lib/system-tests'

systemTests.it(`is working with package with type: module`, {
  withBinary: true,
  browser: 'electron',
  dockerImage: 'cypress/base:16.5.0',
  spec: 'app.cy.js',
  specDir: 'tests',
  project: 'config-cjs-and-esm/config-with-ts-module',
})

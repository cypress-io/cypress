import systemTests from '../lib/system-tests'

systemTests.it(`can run Component Testing with React 18`, {
  withBinary: true,
  browser: 'electron',
  dockerImage: 'cypress/base:16.13.2',
  testingType: 'component',
  project: 'react18',
  spec: 'src/App.cy.jsx',
})

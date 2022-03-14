import systemTests from '../lib/system-tests'

describe('Cypress Axe ecosystem test', function () {
  systemTests.setup()

  /* React A11y is a Create React App example */
  systemTests.it('react-a11y catches failing a11y violations', {
    project: 'react-a11y',
    testingType: 'component',
    spec: 'src/failing.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 1,
  })

  systemTests.it('react-a11y runs a11y tests successfully', {
    project: 'react-a11y',
    testingType: 'component',
    spec: 'src/passing.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

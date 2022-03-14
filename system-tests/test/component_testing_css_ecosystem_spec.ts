import systemTests from '../lib/system-tests'

describe('CSS Ecosystem Tooling', function () {
  systemTests.setup()

  /* React Tailwind is a Create React App example */
  systemTests.it('react-tailwind renders tailwind classes', {
    project: 'react-tailwind',
    testingType: 'component',
    spec: '**/*.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

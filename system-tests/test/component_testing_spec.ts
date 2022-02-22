import systemTests from '../lib/system-tests'

describe('component testing projects', function () {
  systemTests.setup()

  systemTests.it('create-react-app-configured', {
    project: 'create-react-app-configured',
    testingType: 'component',
    spec: 'src/App.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('vueclivue2-configured', {
    project: 'vueclivue2-configured',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('vueclivue3-configured', {
    project: 'vueclivue3-configured',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('react-vite-ts-configured', {
    project: 'react-vite-ts-configured',
    testingType: 'component',
    spec: 'src/App.cy.tsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

import systemTests from '../lib/system-tests'

describe('component testing projects', function () {
  systemTests.setup()

  systemTests.it('vueclivue2-configured', {
    project: 'vueclivue2-configured',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('create-react-app-configured', {
    project: 'create-react-app-configured',
    testingType: 'component',
    spec: 'src/App.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

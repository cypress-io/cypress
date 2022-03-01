import systemTests from '../lib/system-tests'

describe('component testing projects', function () {
  systemTests.setup()

  systemTests.it('create-react-app-custom-index-html', {
    project: 'create-react-app-custom-index-html',
    testingType: 'component',
    spec: 'src/App.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('vueclivue3-custom-index-html', {
    project: 'vueclivue3-custom-index-html',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  // Doesn't pass locally, even on 10.0-release
  systemTests.it.skip('vue3-vite-ts-custom-index-html', {
    project: 'vue3-vite-ts-custom-index-html',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

import systemTests from '../lib/system-tests'

describe('component testing projects', function () {
  systemTests.setup()

  systemTests.it('pristine-create-react-app-js', {
    project: 'pristine-create-react-app-js',
    testingType: 'component',
    spec: 'src/App.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('pristine-nextjs-configured', {
    project: 'pristine-nextjs-configured',
    testingType: 'component',
    spec: 'components/button.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('pristine-vuecli-vue2-configured', {
    project: 'pristine-vuecli-vue2-configured',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('pristine-nuxtjs-vue2-configured', {
    project: 'pristine-nuxtjs-vue2-configured',
    testingType: 'component',
    spec: 'components/Tutorial.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

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
    browser: 'electron',
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

  systemTests.it('vue3-vite-ts-configured', {
    project: 'vue3-vite-ts-configured',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  // TODO: Figure out correct dependencies to make Next.js, 11-12  work.
  systemTests.it.skip('nextjs-configured', {
    project: 'nextjs-configured',
    testingType: 'component',
    spec: 'components/button.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('nuxtjs-vue2-configured', {
    project: 'nuxtjs-vue2-configured',
    testingType: 'component',
    spec: 'components/Tutorial.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  // TODO: Once the Object API for each of the dev-servers is available we can re-enable this
  // Because of an issue with the system-testing infrastructure #UNIFY-1565, Webpack 5 system tests don't work.
  systemTests.it.skip('vuecli5vue3-configured', {
    project: 'vuecli5vue3-configured',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

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

  systemTests.it('vuecli5vue3-configured', {
    project: 'vuecli5vue3-configured',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

const REACT_MAJOR_VERSIONS = ['17', '18'] as const

describe(`React major versions with Vite`, function () {
  systemTests.setup()

  for (const majorVersion of REACT_MAJOR_VERSIONS) {
    it(`executes all of the tests for React v${majorVersion} with Vite`, function () {
      return systemTests.exec(this, {
        project: `react${majorVersion}`,
        configFile: 'cypress-vite.config.ts',
        spec: 'src/App.cy.jsx,src/Unmount.cy.jsx,src/UsingLegacyMount.cy.jsx',
        testingType: 'component',
        browser: 'chrome',
        snapshot: true,
        expectedExitCode: 0,
      })
    })
  }
})

describe(`React major versions with Webpack`, function () {
  systemTests.setup()

  for (const majorVersion of REACT_MAJOR_VERSIONS) {
    it(`executes all of the tests for React v${majorVersion} with Webpack`, function () {
      return systemTests.exec(this, {
        project: `react${majorVersion}`,
        configFile: 'cypress-webpack.config.ts',
        spec: 'src/App.cy.jsx,src/Unmount.cy.jsx,src/UsingLegacyMount.cy.jsx',
        testingType: 'component',
        browser: 'chrome',
        snapshot: true,
        expectedExitCode: 0,
      })
    })
  }
})

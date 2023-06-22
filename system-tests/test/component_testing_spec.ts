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
    spec: 'src/**/*.cy.js',
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

  systemTests.it('issue-25951-next-app', {
    project: 'issue-25951-next-app',
    testingType: 'component',
    spec: 'src/pages/_app.cy.tsx',
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
        spec: 'src/App.cy.jsx,src/Unmount.cy.jsx,src/UsingLegacyMount.cy.jsx,src/Rerendering.cy.jsx,src/mount.cy.jsx',
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
        spec: 'src/App.cy.jsx,src/Unmount.cy.jsx,src/UsingLegacyMount.cy.jsx,src/Rerendering.cy.jsx,src/mount.cy.jsx',
        testingType: 'component',
        browser: 'chrome',
        snapshot: true,
        expectedExitCode: 0,
      })
    })
  }
})

const ANGULAR_VERSIONS = ['13', '14', '15', '16', '16.1']

describe(`Angular CLI versions`, () => {
  systemTests.setup()

  for (const version of ANGULAR_VERSIONS) {
    let spec = 'src/**/*.cy.ts,!src/app/errors.cy.ts'

    if (version === '13') {
      spec = `${spec},!src/app/components/standalone.component.cy.ts`
    }

    systemTests.it(`v${version} with mount tests`, {
      project: `angular-${version}`,
      spec,
      testingType: 'component',
      browser: 'chrome',
      expectedExitCode: 0,
    })
  }

  systemTests.it('angular 14 custom config', {
    project: 'angular-custom-config',
    spec: 'src/app/my-component.cy.ts',
    testingType: 'component',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('angular custom root', {
    project: 'angular-custom-root',
    spec: 'ui/app/app.component.cy.ts',
    testingType: 'component',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

describe('svelte component testing', () => {
  systemTests.setup()

  for (const bundler of ['webpack', 'vite']) {
    systemTests.it(`svelte + ${bundler}`, {
      project: `svelte-${bundler}`,
      testingType: 'component',
      spec: '**/*.cy.js,!src/errors.cy.js',
      browser: 'chrome',
      expectedExitCode: 0,
    })
  }
})

describe('Vue major versions with Vite', () => {
  systemTests.setup()

  systemTests.it('vue 2', {
    project: `vue2`,
    testingType: 'component',
    spec: '**/*.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('vue 3', {
    project: `vue3`,
    testingType: 'component',
    spec: '**/*.cy.js',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

describe('experimentalSingleTabRunMode', function () {
  systemTests.setup()

  systemTests.it('executes all specs in a single tab', {
    project: 'experimentalSingleTabRunMode',
    testingType: 'component',
    spec: '**/*.cy.js',
    browser: 'chrome',
    snapshot: true,
    expectedExitCode: 2,
  })
})

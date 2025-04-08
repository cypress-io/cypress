import systemTests from '../lib/system-tests'

describe('component testing projects', function () {
  systemTests.setup()

  systemTests.it('react-vite-ts-configured', {
    project: 'react-vite-ts-configured',
    testingType: 'component',
    spec: 'src/App.cy.tsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it('vue3-webpack-ts-configured', {
    project: 'vue3-webpack-ts-configured',
    testingType: 'component',
    spec: 'src/components/HelloWorld.cy.ts',
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

  systemTests.it('nextjs-configured', {
    project: 'nextjs-configured',
    testingType: 'component',
    spec: 'components/button.cy.jsx',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

const REACT_MAJOR_VERSIONS = ['18', '19'] as const

describe(`React major versions with Vite`, function () {
  systemTests.setup()

  for (const majorVersion of REACT_MAJOR_VERSIONS) {
    it(`executes all of the tests for React v${majorVersion} with Vite`, function () {
      return systemTests.exec(this, {
        project: `react${majorVersion}`,
        configFile: 'cypress-vite-default.config.ts',
        spec: 'src/App.cy.jsx,src/Unmount.cy.jsx,src/Rerendering.cy.jsx,src/mount.cy.jsx',
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
        spec: 'src/App.cy.jsx,src/Unmount.cy.jsx,src/Rerendering.cy.jsx,src/mount.cy.jsx',
        testingType: 'component',
        browser: 'chrome',
        snapshot: true,
        expectedExitCode: 0,
      })
    })
  }
})

const ANGULAR_VERSIONS = ['17', '18', '19']

describe(`Angular CLI versions`, () => {
  systemTests.setup()

  for (const version of ANGULAR_VERSIONS) {
    systemTests.it(`v${version} with mount tests`, {
      project: `angular-${version}`,
      spec: 'src/**/*.cy.ts,!src/app/errors.cy.ts',
      testingType: 'component',
      browser: 'chrome',
      expectedExitCode: 0,
    })
  }

  systemTests.it('angular 19 custom config', {
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

  systemTests.it('angular signals', {
    project: 'angular-signals',
    testingType: 'component',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

describe('svelte component testing', () => {
  systemTests.setup()

  // svelte-webpack-configured is currently difficult to test.
  // This is currently tested as a binary-like system-test inside CI.
  // We can unskip this test and remove the binary-like CircleCI test
  // once https://github.com/sveltejs/svelte-loader/issues/243 is resolved.
  systemTests.it.skip(`svelte + webpack`, {
    project: `svelte-webpack-configured`,
    testingType: 'component',
    spec: '**/*.cy.ts,!src/lib/errors.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
  })

  systemTests.it(`svelte + vite`, {
    project: `svelte-vite-configured`,
    testingType: 'component',
    spec: '**/*.cy.ts,!src/lib/errors.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
  })
})

describe('Vue major versions with Vite', () => {
  systemTests.setup()

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

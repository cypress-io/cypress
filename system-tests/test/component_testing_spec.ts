import systemTests from '../lib/system-tests'
import { globAsync as glob } from '@packages/server/lib/util/glob'
import Fixtures from '../lib/fixtures'

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
        // @see https://github.com/cypress-io/cypress/issues/30881 and src/Rerendering.cy.jsx for details on skipping.
        spec: 'src/App.cy.jsx,src/Unmount.cy.jsx,src/mount.cy.jsx,!src/Rerendering.cy.jsx',
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

const ANGULAR_VERSIONS = ['18', '19', '20'] as const

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

  // NOTE: Angular 21 has to be tested separate because it uses the zoneless mount function,
  // which doesn't support zone.js any longer OR support autoDetectChanges or autoSpyOutputs
  systemTests.it(`v21 with mount tests`, {
    project: `angular-21`,
    spec: 'src/**/*.cy.ts,!src/app/errors.cy.ts',
    testingType: 'component',
    browser: 'chrome',
    expectedExitCode: 0,
  })

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

  // https://github.com/cypress-io/cypress/issues/23815
  // WebKit records video by closing the page at the end of each spec, which is at odds with
  // single-tab mode reusing one page across specs. Previously only the first spec's video was
  // recorded and the run could hang on exit. Each spec should now record its own video and the
  // run should exit normally.
  systemTests.it('records a video for every spec in WebKit single-tab mode', {
    project: 'experimentalSingleTabRunMode',
    testingType: 'component',
    // 999_final asserts destroyAut between specs, which WebKit+video intentionally skips (#23815)
    spec: '**/*.cy.js,!src/999_final.cy.js',
    browser: 'webkit',
    config: {
      video: true,
    },
    snapshot: false,
    expectedExitCode: 2,
    async onRun (exec) {
      // TODO(webkit): WebKit video recording is flaky, retry to reduce flake (see video_compression_spec)
      this.retries(15)

      await exec()

      const videosPath = Fixtures.projectPath('experimentalSingleTabRunMode/cypress/videos/**/*.mp4')
      const files = await glob(videosPath)

      // the project has 3 specs here (1_fails, 2_foo, 3_retries); each should produce its own video
      expect(files.length).to.eq(3, `expected one video per spec, but found: ${files.join(', ')}`)
    },
  })
})

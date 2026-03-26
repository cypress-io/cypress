import systemTests from '../lib/system-tests'

describe('e2e headless', function () {
  systemTests.setup()

  describe('ELECTRON_RUN_AS_NODE', () => {
    const baseSpec = {
      spec: 'headless.cy.js',
      config: {
        env: {
          'CI': process.env.CI,
          'EXPECT_HEADLESS': '1',
        },
      },
      headed: false,
      processEnv: {
        // Ensure that electron is spawned as a node process.
        ELECTRON_RUN_AS_NODE: 1,
        // Ensure that the current xserver is not passed to the test.
        DISPLAY: '',
        // Debug cypress:server:run to look for a message that electron/xvfb were not spawned.
        DEBUG: 'cypress:server:run',
      },
    }

    systemTests.it('pass for browsers that do not need xvfb', {
      ...baseSpec,
      browser: ['chrome', 'firefox'],
      expectedExitCode: 0,
      onRun (exec) {
        return exec().then(({ stderr }) => {
          expect(stderr).to.include('running electron as a node process without xvfb')
        })
      },
    })
  })

  // cypress run --headless
  systemTests.it('tests in headless mode pass', {
    spec: 'headless.cy.js',
    config: {
      env: {
        'CI': process.env.CI,
        'EXPECT_HEADLESS': '1',
      },
    },
    headed: false,
    snapshot: true,
  })

  systemTests.it('tests in headed mode pass in chrome', {
    spec: 'headless.cy.js',
    config: {
      env: {
        'CI': process.env.CI,
      },
    },
    expectedExitCode: 0,
    headed: true,
    snapshot: true,
    browser: 'chrome',
  })

  systemTests.it('launches maximized by default in headless mode', {
    headed: false,
    project: 'screen-size',
    spec: 'default_size.cy.js',
    config: {
      env: {
        'CI': process.env.CI,
      },
    },
  })

  systemTests.it('launches at DPR 1x', {
    headed: false,
    project: 'screen-size',
    spec: 'device_pixel_ratio.cy.js',
  })
})

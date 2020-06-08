import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e headless', function () {
  e2e.setup()

  // cypress run --headless
  e2e.it('tests in headless mode pass', {
    spec: 'headless_spec.js',
    config: {
      env: {
        'CI': process.env.CI,
        'EXPECT_HEADLESS': '1',
      },
    },
    headed: false,
    snapshot: true,
  })

  // NOTE: cypress run --headed
  // currently, Electron differs because it displays a
  // "can not record video in headed mode" error
  // this trick allows us to have 1 snapshot for electron
  // and 1 for every other browser
  ;[
    'electron',
    '!electron',
  ].map((b) => {
    e2e.it(`tests in headed mode pass in ${b}`, {
      spec: 'headless_spec.js',
      config: {
        env: {
          'CI': process.env.CI,
        },
      },
      expectedExitCode: 0,
      headed: true,
      snapshot: true,
      browser: b,
    })
  })

  e2e.it('launches maximized by default in headless mode (1280x720)', {
    browser: 'chrome',
    headed: false,
    project: Fixtures.projectPath('screen-size'),
    spec: '720p.spec.js',
  })
})

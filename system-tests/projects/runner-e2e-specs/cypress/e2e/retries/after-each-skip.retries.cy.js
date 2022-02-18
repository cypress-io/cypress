import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'afterEach hooks': {
      options: {
        retries: 1,
      },
      hooks: [{ type: 'afterEach', fail: true }],
      tests: ['fails in afterEach', 'skips this'],
    },
  },
})

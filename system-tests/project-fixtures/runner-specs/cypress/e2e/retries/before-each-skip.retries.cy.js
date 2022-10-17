import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'beforeEach hooks': {
      options: {
        retries: 1,
      },
      hooks: [{ type: 'beforeEach', fail: true }],
      tests: ['fails in beforeEach', 'skips this'],
    },
  },
})

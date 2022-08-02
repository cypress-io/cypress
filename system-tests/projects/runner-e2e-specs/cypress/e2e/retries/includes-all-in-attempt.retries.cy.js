import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    's1': {
      options: {
        retries: 2,
      },
      hooks: [{ type: 'beforeEach', fail: 1, agents: true }],
      tests: [{ name: 't1', fail: 1, agents: true }],
    },
  },
})

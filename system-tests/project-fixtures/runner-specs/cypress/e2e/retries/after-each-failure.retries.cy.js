import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  hooks: [{ type: 'afterEach', fail: 2 }],
  suites: {
    's1': {
      options: {
        retries: 2,
      },
      hooks: [{ type: 'afterEach', fail: 1 }, 'afterEach', 'after'],
      tests: ['t1'],
    },
  },
})

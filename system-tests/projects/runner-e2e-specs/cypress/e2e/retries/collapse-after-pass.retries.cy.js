import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      options: {
        retries: 2,
      },
      tests: [
        { name: 'test pass', fail: 0 },
        { name: 'test pass on 2nd attempt', fail: 1 },
      ],
    },
  },
})

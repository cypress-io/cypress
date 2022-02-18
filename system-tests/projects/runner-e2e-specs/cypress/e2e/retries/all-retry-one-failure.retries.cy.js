import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      options: {
        retries: 1,
      },
      tests: [
        { name: 'test 1', fail: 1 },
        { name: 'test 2', fail: 2 },
        { name: 'test 3', fail: 1 },
      ],
    },
  },
})

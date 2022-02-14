import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      hooks: [{ type: 'after' }],
      tests: [{ name: 'test 1', fail: true }, 'test 2'],
    },
  },
})

import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': { tests: ['test 1', 'test 2'],
      suites: {
        'suite 1-1': {
          tests: ['test 1'],
        },
      } },
  },
})

import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      options: {
        retries: 1,
      },
      hooks: [
        { type: 'before', fail: 1 },
        'beforeEach',
        'beforeEach',
        'afterEach',
        'afterEach',
        'after',
      ],
      tests: ['test 1'],
    },
  },
})

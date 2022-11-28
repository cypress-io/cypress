import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      options: { retries: 1 },
      hooks: [
        'before',
        'beforeEach',
        'beforeEach',
        'afterEach',
        'afterEach',
        { type: 'after', fail: 1 },
      ],
      tests: [{ name: 'test 1' }],
    },
  },
})

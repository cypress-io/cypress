import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  hooks: [{ type: 'beforeEach', fail: 1 }],
  suites: {
    'suite 1': {
      options: {
        retries: 2,
      },
      hooks: [
        'before',
        'beforeEach',
        { type: 'beforeEach', fail: 1 },
        'beforeEach',
        'afterEach',
        'after',
      ],
      tests: [{ name: 'test 1' }],
    },
  },
})

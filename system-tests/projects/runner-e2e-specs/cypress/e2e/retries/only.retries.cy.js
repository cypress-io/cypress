import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      options: {
        retries: 2,
      },
      hooks: ['before', 'beforeEach', 'afterEach', 'after'],
      tests: [
        { name: 'test 1' },
        { name: 'test 2', fail: 1, only: true },
        { name: 'test 3' },
      ],
    },
  },
})

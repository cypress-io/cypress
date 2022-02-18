import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      hooks: ['before', 'beforeEach', 'afterEach', 'after'],
      tests: [
        { name: 'test 1' },
        { name: 'test 2', only: true },
        { name: 'test 3' },
      ],
    },
  },
})

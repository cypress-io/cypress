import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      tests: [
        'test 1',
        {
          name: 'test 2',
          fail: true,
        },
      ],
    },
    'suite 2': {
      tests: [
        'test 1',
        {
          name: 'test 2',
          fail: true,
        },
      ],
    },
  },
})

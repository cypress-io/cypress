import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      options: {
        retries: 2,
      },
      tests: [
        {
          name: 'test 1',
          fail: true,
        },
        {
          name: 'test 2',
        },
      ],
    },
  },
})

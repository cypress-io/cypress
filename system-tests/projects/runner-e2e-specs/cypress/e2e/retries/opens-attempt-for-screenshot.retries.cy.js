import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

before(() => {
  window.__cySkipValidateConfig = true
})

generateMochaTestsForWin(window, {
  suites: {
    's1': {
      options: { retries: 3, isTextTerminal: true },
      tests: [
        't1',
        {
          name: 't2',
          fail: 3,
        },
        't3',
      ],
    },
  },
})

after(() => {
  window.__cySkipValidateConfig = false
})

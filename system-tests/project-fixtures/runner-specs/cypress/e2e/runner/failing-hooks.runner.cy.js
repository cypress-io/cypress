import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'simple failing hook spec': {
      suites: {
        'beforeEach hooks': {
          hooks: [{ type: 'beforeEach', fail: true }],
          tests: ['never gets here'],
        },
        'pending': {
          tests: [{ name: 'is pending', pending: true }],
        },
        'afterEach hooks': {
          hooks: [{ type: 'afterEach', fail: true }],
          tests: ['fails this', 'does not run this'],
        },
        'after hooks': {
          hooks: [{ type: 'after', fail: true }]
          , tests: ['runs this', 'fails on this'],
        },
      },
    },
  },
})

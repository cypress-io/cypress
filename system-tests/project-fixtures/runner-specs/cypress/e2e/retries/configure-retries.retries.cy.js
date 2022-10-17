import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': () => {
      it('[no retry]', { retries: 0 }, () => assert(false))
      it('[1 retry]', { retries: 1 }, () => assert(false))
      it('[2 retries]', { retries: 2 }, () => assert(false))
      it('[open mode, no retry]', { retries: { runMode: 2, openMode: 0 } }, () => assert(false))
      it('[run mode, retry]', { retries: { runMode: 1, openMode: 0 }, isInteractive: false }, () => assert(false))
      it('[open mode, 2 retries]', { retries: { runMode: 0, openMode: 2 }, isInteractive: true }, () => assert(false))
      describe('suite 2', { retries: 1 }, () => {
        it('[set retries on suite]', () => assert(false))
      })
    },
  },
})

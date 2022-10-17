import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': () => {
      it('tries to set mocha retries', function () {
        this.retries(null)
      })
    },
  },
})

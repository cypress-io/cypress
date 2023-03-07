import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': () => {
      beforeEach(function () {
        this.retries(0)
      })

      it('foo', () => {})
    },
  },

})

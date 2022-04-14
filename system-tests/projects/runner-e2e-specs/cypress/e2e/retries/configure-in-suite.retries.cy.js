import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    // eslint-disable-next-line object-shorthand
    'suite 1': function () {
      this.retries(3)
      it('test 1', () => {
      })
    },
  },
})

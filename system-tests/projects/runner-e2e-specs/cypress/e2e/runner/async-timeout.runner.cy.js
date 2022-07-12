import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'async': {
      tests: [{
        name: 'bar fails',
        // eslint-disable-next-line
        fn (done) {
          this.timeout(100)
          cy.on('fail', () => {})
          // foo is intentionally undefined
          // eslint-disable-next-line
          foo.bar() // kaboom
        },
        eval: true,
      }],
    },
  },
})

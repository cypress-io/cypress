import { generateMochaTestsForWin } from '../support/generate-mocha-tests'

generateMochaTestsForWin(window, {
  suites: {
    'suite 1': {
      tests: [
        {
          name: 'test 1',
          fn: () => {
            cy.on('fail', () => {
              return false
            })

            expect(false).ok
            throw new Error('error in test')
          },
          eval: true,
        },
      ],
    },
  },
})

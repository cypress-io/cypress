const { createCypress } = require('../../support/helpers')
const { runIsolatedCypress } = createCypress()

// https://github.com/cypress-io/cypress/issues/8350
describe('issue-8350', () => {
  it('does not hang on nested hook', () => {
    runIsolatedCypress(() => {
      before(() => {
        beforeEach(() => {
        })
      })

      describe('s1', () => {
        it('t1', () => {
          //
        })
      })
    })
  })
})

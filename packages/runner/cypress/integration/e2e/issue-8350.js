const { createCypress } = require('../support/helpers')
const { runIsolatedCypress } = createCypress()

describe('issue-8350', () => {
  it('does not hang on nested hook', () => {
    runIsolatedCypress(() => {
      before(() => {
        beforeEach(() => {
        })
      })

      describe('ae inside be', () => {
        it('t1', () => {
          //
        })
      })
    })
  })
})

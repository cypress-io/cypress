// Regression test for https://github.com/cypress-io/cypress/issues/24448
// When a describe block's tags are negated by the grep filter, before/after hooks
// inside that describe must NOT execute.

let beforeCalled = false
let afterCalled = false

describe('filtered out smoke suite', { tags: '@smoke' }, () => {
  before(() => {
    beforeCalled = true
  })

  after(() => {
    afterCalled = true
  })

  it('smoke test', () => {
    expect(true).to.be.true
  })
})

describe('verify hooks were not called when parent suite was excluded', () => {
  it('before hook was skipped', () => {
    expect(beforeCalled).to.equal(false)
  })

  it('after hook was skipped', () => {
    expect(afterCalled).to.equal(false)
  })
})

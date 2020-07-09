import './setup'

describe('validation errors', { defaultCommandTimeout: 0 }, () => {
  it('from cypress', () => {
    cy.viewport()
  })

  it('from chai expect', () => {
    expect(true).to.be.nope
  })

  it('from chai assert', () => {
    assert.deepInclude()
  })
})

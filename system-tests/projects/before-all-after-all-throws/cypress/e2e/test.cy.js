describe('before all and after all throw', () => {
  before(() => {
    cy.log('before all').then(() => {
      console.log('before all')
      throw new Error('before all')
    })
  })

  after(() => {
    cy.log('after all').then(() => {
      console.log('after all')
      throw new Error('after all')
    })
  })

  it('test 1', () => {
    console.log('test body 1')
    expect(true).to.be.true
  })

  it('test 2', () => {
    console.log('test body 2')
    expect(true).to.be.true
  })
})

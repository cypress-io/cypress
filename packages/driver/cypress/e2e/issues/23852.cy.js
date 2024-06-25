describe('issue visible element with parent 0 width are detected as not visible', () => {
  before(() => {
    cy
    .viewport('macbook-16')
    .visit('/fixtures/issue-23852.html')
  })

  it('can click element when effective 0 width parent used', () => {
    expect(cy.$$('#hidden')).to.not.be.visible
    //cy.get('#id2 >div > p').click()
  })
})

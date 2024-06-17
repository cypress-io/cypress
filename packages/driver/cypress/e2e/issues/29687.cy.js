describe('issue visible element with parent 0 width are detected as not visible', () => {
  before(() => {
    cy
    .viewport('macbook-16')
    .visit('/fixtures/issue-zeroWidthVisible.html')
  })

  it('can click element when effective 0 width parent used', () => {
    cy.get('#id1 >div > p').click()
    expect(cy.$$('#id2 >div > p')).to.be.visible
    cy.get('#id2 >div > p').click()
  })
})

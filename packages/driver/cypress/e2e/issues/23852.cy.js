// https://github.com/cypress-io/cypress/issues/23852
describe('issue visible element with parent 0 width are detected as not visible', () => {
  before(() => {
    cy
    .viewport('macbook-16')
    .visit('/fixtures/issue-23852.html')
  })

  it('can click element when effective 0 width parent used', () => {
    expect(cy.$$('#hidden')).to.not.be.visible
  })
})

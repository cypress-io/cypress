/* eslint-disable no-undef */
describe('http2 multiplex interleaved', () => {
  it('does not head-of-line block fast streams behind slow ones', () => {
    cy.visit('/multiplex-interleaved')
    cy.get('#order', { timeout: 10000 }).should(($el) => {
      const order = $el.text().split(',').map(Number)

      expect(order).to.have.length(6)
      expect(order.slice(0, 3)).to.deep.equal([3, 4, 5])
      expect(order.slice(3)).to.have.members([0, 1, 2])
    })
  })
})

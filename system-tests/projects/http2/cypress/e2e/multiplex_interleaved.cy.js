/* eslint-disable no-undef */
describe('http2 multiplex interleaved', () => {
  it('does not head-of-line block fast streams behind slow ones', () => {
    cy.visit('/multiplex-interleaved')
    cy.get('#order', { timeout: 10000 }).should(($el) => {
      const order = $el.text().split(',').map(Number)
      const fastIds = [3, 4, 5]
      const slowIds = [0, 1, 2]

      expect(order).to.have.length(6)
      expect(order).to.have.members([...fastIds, ...slowIds])

      for (const fast of fastIds) {
        for (const slow of slowIds) {
          expect(order.indexOf(fast)).to.be.lessThan(order.indexOf(slow))
        }
      }
    })
  })
})

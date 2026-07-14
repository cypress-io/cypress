/* eslint-disable no-undef */
const ORIGIN = 'https://www.h2test.local:44701'

describe('http2 stream priority', () => {
  it('completes high-priority streams before low-priority ones', () => {
    cy.visit(`${ORIGIN}/priority`)
    cy.get('#order', { timeout: 10000 }).should(($el) => {
      const order = $el.text().split(',').map(Number)
      const highIds = [3, 4, 5]
      const lowIds = [0, 1, 2]

      expect(order).to.have.length(6)
      expect(order).to.have.members([...highIds, ...lowIds])

      for (const high of highIds) {
        for (const low of lowIds) {
          expect(order.indexOf(high)).to.be.lessThan(order.indexOf(low))
        }
      }
    })
  })
})
